'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// Stack Auth SDKとエラーハンドリングでany型を使用

import { useAuth } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SubscriptionInfo {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  cancelAtPeriodEnd: boolean;
}

export default function DashboardPage() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const hasActiveContract = subscription?.status != null && subscription.status !== 'canceled';
  const isCancelScheduled = subscription?.cancelAtPeriodEnd === true;
  const isEmailUnverified = Boolean(user && user.email && user.primaryEmailVerified === false);

  // 未ログイン時はトップへリダイレクト。ただし auth state 確定後に限る（Supabase時のフラッシュ回避）
  useEffect(() => {
    const isLoading = (auth as any).isLoading;
    if (!user && !isLoading) {
      router.replace('/');
    }
  }, [user, auth, router]);

  // サブスクリプション詳細情報の取得
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Skip during sign-out to avoid transient unauthorized responses
        try {
          if (localStorage.getItem('signing_out') === '1') return;
        } catch {}
        if (!user) return;
        const res = await fetch('/api/stripe/subscription', { cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (data?.subscription) {
          setSubscription({
            status: data.subscription.status,
            cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd || false,
          });
        } else {
          setSubscription(null);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pb-8 pt-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-strong">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            ようこそ、{user?.displayName || user?.email?.split('@')[0] || 'ユーザー'} さん
          </h1>
          <p className="mb-4 text-gray-600">ダッシュボードへようこそ。</p>

          {isEmailUnverified && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
              メールアドレスが未認証です。
              <a href="/auth/email-verified" className="underline">
                認証メールのリンク
              </a>
              を確認してください。
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              {message}
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs text-gray-400 transition-colors hover:text-gray-500">
                <span>アカウント設定</span>
                <svg
                  className="h-3 w-3 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="mt-3 space-y-3">
                {/* 退会ボタンを押したときだけエラーメッセージを出す。通常は説明のみ表示 */}
                <p className="text-xs text-gray-500">
                  退会すると、アカウントと関連データは削除されます。
                </p>

                {/* キャンセル予定の場合は注意メッセージを表示 */}
                {hasActiveContract && isCancelScheduled && (
                  <div className="mb-3 rounded border border-yellow-200 bg-yellow-50 p-2">
                    <p className="text-xs text-yellow-700">
                      プランはキャンセル予定です。
                      <br />
                      いま退会するとアカウントと関連データは削除され即時利用できなくなります。
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* 購読を管理ボタンは撤去 */}
                  <button
                    onClick={async () => {
                      if (!user || deleting) return;

                      // 契約があるがキャンセル予定ではない場合
                      if (hasActiveContract && !isCancelScheduled) {
                        setMessage(
                          'プランの解約が必要です。購読を管理からプランをキャンセルしてください。'
                        );
                        return;
                      }

                      // キャンセル予定の場合は即時削除の警告を表示
                      const confirmMessage = isCancelScheduled
                        ? '退会するとアカウントと関連データは即座に削除され、プランも即時終了します。本当に退会しますか？'
                        : '本当に退会しますか？この操作は取り消せません。';

                      const ok = window.confirm(confirmMessage);
                      if (!ok) return;
                      setDeleting(true);
                      setMessage('退会処理を実行しています…');
                      try {
                        const res = await fetch('/api/account/delete', { method: 'POST' });
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}));
                          if (res.status === 409) {
                            setMessage(
                              data.error ||
                                'プランの解約が必要です。購読を管理からプランをキャンセルしてください。'
                            );
                          } else if (res.status === 401) {
                            setMessage('未ログインのため処理できません。');
                          } else {
                            setMessage(
                              data.error || '退会に失敗しました。時間をおいて再度お試しください。'
                            );
                          }
                          return;
                        }
                        // 退会後にセッションを明示的に破棄してトップへ
                        try {
                          await auth.signOut();
                        } catch {}
                        router.push('/');
                      } catch (e: any) {
                        console.error('Account deletion failed:', e);
                        setMessage('退会に失敗しました。時間をおいて再度お試しください。');
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={!user || deleting}
                    className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                      deleting
                        ? 'cursor-not-allowed border-gray-200 text-gray-400 opacity-40'
                        : 'border-gray-300 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {deleting ? '処理中…' : '退会'}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
