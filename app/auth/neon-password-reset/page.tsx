'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// Stack Auth SDKの型定義が不完全なため、any型の使用を許可

import { useState } from 'react';
import Link from 'next/link';
import { useStackApp } from '@stackframe/stack';
import { useSearchParams } from 'next/navigation';

export default function NeonPasswordResetPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';

  const app = useStackApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code) {
      setError('リセットリンクからアクセスしてください（codeが見つかりません）');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }
    if (password !== confirm) {
      setError('確認用パスワードが一致しません');
      return;
    }
    setIsLoading(true);
    try {
      const anyApp: any = app as any;
      if (!anyApp?.resetPassword) throw new Error('resetPassword API が利用できません');
      const result = await anyApp.resetPassword({ password, code });
      if (result?.status === 'error') {
        setError(result?.error?.message || 'パスワードリセットに失敗しました');
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(`エラーが発生しました: ${err?.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-sm">
          <div className="mb-4 text-center">
            <h1 className="text-lg font-medium text-slate-800">パスワードをリセット</h1>
          </div>

          {!code && !success && (
            <div className="mb-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
              リセットリンクからアクセスしてください。リンクの有効期限が切れている可能性があります。
            </div>
          )}

          {success ? (
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
              <p className="mb-4 text-sm text-slate-700">パスワードを更新しました。</p>
              <Link
                href="/auth/signin"
                className="inline-block rounded bg-blue-600 px-3 py-2 text-sm text-white"
              >
                ログイン画面へ
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="stack-reset space-y-3" autoComplete="on">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="8文字以上"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="もう一度入力"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
                  data-error
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !code}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? '更新中...' : 'パスワードを更新'}
              </button>

              <div className="mt-2 text-center">
                <Link href="/auth/signin" className="text-xs text-blue-600 hover:text-blue-700">
                  ← ログイン画面に戻る
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
