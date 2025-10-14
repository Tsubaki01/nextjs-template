'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// エラーハンドリングで使用

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/client';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await auth.sendPasswordReset?.(email);
      if (res && !res.ok) throw new Error(res.error || 'RESET_FAILED');
      setSuccess(true);
    } catch (err: any) {
      setError('メールの送信に失敗しました。もう一度お試しください');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="mb-3 text-lg font-medium text-slate-800">メールを送信しました</h1>
              <p className="mb-4 text-xs text-slate-600">
                パスワードリセット用のリンクを
                <br />
                <span className="font-medium">{email}</span>
                <br />
                に送信しました
              </p>
              <p className="mb-4 text-xs text-slate-500">
                メールが届かない場合は迷惑メールフォルダをご確認ください
              </p>
              <Link
                href="/auth/signin"
                className="inline-block w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white"
              >
                ログイン画面に戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-sm">
          <div className="mb-4 text-center">
            <h1 className="mb-2 text-lg font-medium text-slate-800">パスワードをリセット</h1>
            <p className="text-xs text-slate-600">登録したメールアドレスを入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-600">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? '送信中...' : 'リセットリンクを送信'}
            </button>
          </form>

          {/* ログイン画面へのリンクは不要のため削除 */}
        </div>
      </div>
    </main>
  );
}
