'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// Stack Auth SDKとエラーハンドリングでany型を使用

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface Subscription {
  id: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [_isSigningOut, setIsSigningOut] = useState(false);

  // 成功/キャンセルパラメータの確認
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const sessionIdFromUrl = searchParams.get('session_id');

  useEffect(() => {
    // Detect if we're in the middle of a sign out to suppress signup prompt flash
    try {
      if (localStorage.getItem('signing_out') === '1') {
        setIsSigningOut(true);
        localStorage.removeItem('signing_out');
      }
    } catch {}
  }, []);

  // Redirect only after auth state is resolved to avoid redirecting while loading
  useEffect(() => {
    if (!user && !auth.isLoading) {
      router.replace('/');
    }
  }, [user, auth.isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // 成功で戻ってきた直後、Webhook 反映前のフォールバック同期
  useEffect(() => {
    const trySync = async () => {
      if (!success || !sessionIdFromUrl || !user) return;
      // 既に取得できていればスキップ
      if (subscription?.status) return;
      try {
        const res = await fetch('/api/stripe/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdFromUrl }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) setSubscription(data.subscription);
        }
      } catch {}
    };
    trySync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, sessionIdFromUrl, user]);

  const fetchSubscription = async () => {
    try {
      // Skip network calls during sign-out to avoid transient 401s/flash
      try {
        if (localStorage.getItem('signing_out') === '1') return;
      } catch {}
      const response = await fetch('/api/stripe/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        // currentPeriodEnd が未設定の場合はStripeからの最新状態で強制同期
        if (data.subscription && !data.subscription.currentPeriodEnd) {
          try {
            const res = await fetch('/api/stripe/refresh', { method: 'POST' });
            if (res.ok) {
              const refreshed = await res.json();
              if (refreshed.subscription) setSubscription(refreshed.subscription);
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data?.error || 'チェックアウトの開始に失敗しました');
        return;
      }

      const { url } = await response.json();
      if (!url) {
        setErrorMessage('チェックアウトURLの取得に失敗しました');
        return;
      }

      // Stripe Checkout ページへリダイレクト
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage('ネットワークまたはサーバーエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'エラーが発生しました');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage('ポータルURLが取得できませんでした');
      }
    } catch (error) {
      console.error('Portal error:', error);
      setErrorMessage('ネットワークエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">リダイレクト中...</h2>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <h2 className="mb-2 text-lg font-semibold text-slate-900">読み込み中</h2>
          <p className="text-sm text-slate-600">サブスクリプション情報を取得しています...</p>
        </div>
      </main>
    );
  }

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isCancelScheduled =
    !!subscription &&
    subscription.status !== 'canceled' &&
    (subscription.cancelAtPeriodEnd || !!subscription.cancelAt);
  const endForCompare = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;
  const nowForCompare = new Date();
  const isPastEnd = !!(endForCompare && nowForCompare.getTime() >= endForCompare.getTime());
  const isCanceledDisplay = subscription?.status === 'canceled' || (isCancelScheduled && isPastEnd);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl font-bold text-transparent">
            プラン
          </h1>
        </div>

        {Boolean(user && user.email && (user as any).primaryEmailVerified === false) && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
            メールアドレスが未認証です。
            <a href="/auth/email-verified" className="underline">
              認証メールのリンク
            </a>
            を確認してください。
          </div>
        )}

        {/* Success/Cancel messages */}
        {success && (
          <div className="mb-6 rounded-r-lg border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  サブスクリプションの登録が完了しました
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  ご登録ありがとうございます。すべての機能をご利用いただけます。
                </p>
              </div>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 rounded-r-lg border-l-4 border-red-400 bg-gradient-to-r from-red-50 to-red-100 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">エラーが発生しました</p>
                <p className="mt-1 text-xs text-red-700">{errorMessage}</p>
              </div>
              <button onClick={() => setErrorMessage(null)} className="ml-auto flex-shrink-0">
                <svg
                  className="h-4 w-4 text-red-400 hover:text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        {canceled && (
          <div className="mb-6 rounded-r-lg border-l-4 border-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 p-4 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-800">お支払いがキャンセルされました</p>
                <p className="mt-1 text-xs text-slate-700">いつでも再度お申し込みいただけます。</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Subscription Card */}
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">現在のプラン</h2>
            </div>

            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-slate-900">プレミアムプラン</h3>
                    <p className="text-sm text-slate-600">月額 980円（税込）</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      isCancelScheduled && !isPastEnd
                        ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                        : isCanceledDisplay
                          ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                          : isActive
                            ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                            : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800'
                    }`}
                  >
                    {isCancelScheduled && !isPastEnd ? (
                      'キャンセル予定'
                    ) : isCanceledDisplay ? (
                      'キャンセル済み'
                    ) : (
                      <>
                        {subscription.status === 'active' && '有効'}
                        {subscription.status === 'trialing' && 'トライアル中'}
                        {subscription.status === 'past_due' && '支払い遅延'}
                        {subscription.status === 'incomplete' && '未完了'}
                        {subscription.status === 'unpaid' && '未払い'}
                      </>
                    )}
                  </span>
                </div>

                {(() => {
                  const tz: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Tokyo' };
                  const end = subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd)
                    : null;
                  const canceledScheduled = subscription.cancelAtPeriodEnd && !isCanceledDisplay;
                  // 期限経過後かつキャンセル状態のときは有効期限表示もしない
                  if (isCanceledDisplay && isPastEnd) {
                    return null;
                  }
                  if (canceledScheduled && end) {
                    return (
                      <p className="text-xs text-gray-500">
                        解約予定日: {end.toLocaleDateString('ja-JP', tz)}
                      </p>
                    );
                  }
                  if (end) {
                    return (
                      <p className="text-xs text-gray-500">
                        {isCanceledDisplay || !isActive ? '有効期限' : '契約更新日'}:{' '}
                        {end.toLocaleDateString('ja-JP', tz)}
                      </p>
                    );
                  }
                  return null;
                })()}

                {isCanceledDisplay && subscription.currentPeriodEnd && !isPastEnd && (
                  <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <p className="text-xs font-medium text-slate-800">
                          サブスクリプションはキャンセルされました
                        </p>
                        <p className="mt-0.5 text-xs text-slate-700">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}{' '}
                          まではプレミアム機能をご利用いただけます。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  {/* 請求先表示は削除 */}

                  {subscription.status === 'canceled' ? (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                      size="sm"
                    >
                      {isProcessing ? '処理中...' : 'プランを再開する'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      variant="outline"
                      disabled={isProcessing}
                      className="w-full border-slate-200 hover:bg-slate-50"
                      size="sm"
                    >
                      {isProcessing ? '処理中...' : 'サブスクリプションを管理'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-600">現在、有効なサブスクリプションはありません</p>
              </div>
            )}
          </div>

          {/* Premium Plan Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-xl transition-all duration-300 hover:shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">プレミアムプラン</h2>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">¥980</span>
                <span className="text-sm text-white/80">/ 月</span>
              </div>
              <p className="text-xs text-white/80">税込価格</p>
            </div>

            <ul className="mb-6 space-y-3">
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-white/90">ここに特典をいれます</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-white/90">無制限のアクセス</span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-white/90">プレミアムサポート</span>
              </li>
            </ul>

            {!subscription && (
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-white py-4 text-base font-medium text-blue-600 hover:bg-white/90"
                size="lg"
              >
                {isProcessing ? '処理中...' : '今すぐ登録する'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
