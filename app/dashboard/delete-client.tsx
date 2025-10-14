'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';

type SubscriptionInfo = {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  cancelAtPeriodEnd: boolean;
} | null;

export function DeleteClient() {
  const router = useRouter();
  const auth = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfo>(null);

  const hasActiveContract = subscription?.status != null && subscription.status !== 'canceled';
  const isCancelScheduled = subscription?.cancelAtPeriodEnd === true;

  // Fetch subscription info (if API exists)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stripe/subscription', { cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (data?.subscription) {
          setSubscription({
            status: data.subscription.status,
            cancelAtPeriodEnd: Boolean(data.subscription.cancelAtPeriodEnd),
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signOutAny = async () => {
    try {
      await auth.signOut();
    } catch {}
  };

  const handleDelete = async () => {
    if (deleting) return;
    if (hasActiveContract && !isCancelScheduled) {
      setMessage('プランの解約が必要です。購読を管理からプランをキャンセルしてください。');
      return;
    }
    const confirmMessage = isCancelScheduled
      ? '退会するとアカウントと関連データは即座に削除され、プランも即時終了します。本当に退会しますか？'
      : '本当に退会しますか？この操作は取り消せません。';
    if (!window.confirm(confirmMessage)) return;

    setDeleting(true);
    setMessage('退会処理を実行しています…');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setMessage(
            data.error || 'プランの解約が必要です。購読を管理からプランをキャンセルしてください。'
          );
        } else if (res.status === 401) {
          setMessage('未ログインのため処理できません。');
        } else {
          setMessage(data.error || '退会に失敗しました。時間をおいて再度お試しください。');
        }
        return;
      }
      try {
        await signOutAny();
      } catch {}
      router.push('/');
    } catch (_e) {
      setMessage('退会に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-100 pt-6 text-left">
      {message && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          {message}
        </div>
      )}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between text-xs text-gray-400 transition-colors hover:text-gray-500">
          <span>アカウント設定</span>
          <svg
            className="h-3 w-3 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-500">
            退会すると、アカウントと関連データは削除されます。
          </p>
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
            <button
              onClick={handleDelete}
              disabled={deleting}
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
  );
}
