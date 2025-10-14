'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/client';

function EmailVerifiedContent() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = useMemo(
    () => searchParams.get('code') || searchParams.get('token') || '',
    [searchParams]
  );
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    code ? 'verifying' : 'error'
  );
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const codeMissing = !code;

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!code) {
        // ダッシュボード/プランからの遷移（コードなし）の場合は案内文のみ表示する
        setStatus('error');
        return;
      }
      try {
        const r = await fetch(`/api/auth/neon/verify?code=${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const res = await r.json().catch(() => ({}));
        if (!mounted) return;
        if (r.ok && res && res.ok) {
          setStatus('success');
          setMessage('メールアドレスの認証が完了しました。ダッシュボードへ移動します。');
          // Force a hard navigation to avoid any stale client state
          setTimeout(() => {
            try {
              window.location.assign('/dashboard');
            } catch {
              router.replace('/dashboard');
            }
          }, 800);
        } else {
          setStatus('error');
          setMessage(
            res?.error || '検証に失敗しました。リンクの有効期限が切れている可能性があります。'
          );
        }
      } catch (_e) {
        setStatus('error');
        setMessage('検証処理でエラーが発生しました。時間をおいて再度お試しください。');
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [auth, code, router]);

  const handleResend = async () => {
    if (!user) return;
    try {
      setResending(true);
      const res = await auth.resendEmailVerification?.();
      if (res && res.ok) {
        setMessage('認証メールを再送信しました。受信トレイをご確認ください。');
      } else {
        setMessage('再送信に失敗しました。時間をおいて再度お試しください。');
      }
    } catch {
      setMessage('再送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/80 px-5 py-4 text-center shadow-xl backdrop-blur-sm">
        {!codeMissing && (
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${status === 'success' ? 'bg-emerald-100' : status === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}
          >
            {status === 'success' ? (
              <svg
                className="h-6 w-6 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : status === 'error' ? (
              <svg
                className="h-6 w-6 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6 animate-spin text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            )}
          </div>
        )}
        <h1 className="mb-3 text-lg font-medium text-slate-800">メール認証</h1>
        {codeMissing ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">メールの認証リンクからアクセスしてください。</p>
            <p className="text-xs text-slate-600">
              届いていない場合は迷惑メールを確認してください。
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={handleResend}
                disabled={resending}
                className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {resending ? '送信中…' : '認証メールを再送信'}
              </button>
            </div>
            {message && <p className="text-[11px] text-slate-500">{message}</p>}
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-slate-600">
              {message || (status === 'verifying' ? '検証中です…' : '')}
            </p>
            {status === 'error' && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {resending ? '送信中…' : '認証メールを再送信'}
                </button>
                <Link
                  href="/auth/signin"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  ログインに戻る
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function EmailVerifiedFallback() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm rounded-xl border border-white/20 bg-white/80 px-5 py-4 text-center shadow-xl backdrop-blur-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <h1 className="mb-3 text-lg font-medium text-slate-800">メール認証</h1>
        <p className="text-xs text-slate-600">読み込み中...</p>
      </div>
    </main>
  );
}

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<EmailVerifiedFallback />}>
      <EmailVerifiedContent />
    </Suspense>
  );
}
