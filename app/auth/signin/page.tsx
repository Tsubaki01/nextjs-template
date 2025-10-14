'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';

export default function SignInPage() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 既にログイン済みの場合はレンダー外で遷移
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await auth.signIn({ email, password });
      if (result.ok) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
        if (result.error === 'EMAIL_PASSWORD_MISMATCH') {
          setError('メールアドレスまたはパスワードが正しくありません');
        } else if (result.error === 'USER_NOT_FOUND') {
          setError('このメールアドレスは登録されていません');
        } else {
          setError('ログインに失敗しました');
        }
      }
    } catch (_err) {
      setIsLoading(false);
      setError('エラーが発生しました');
    }
  };

  const handleOAuthSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await auth.signInWithGoogle();
    } catch (_err) {
      setIsLoading(false);
      setError('Googleログインに失敗しました');
    }
  };

  if (user) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-sm">
          <div className="mb-4 text-center">
            <h1 className="text-lg font-medium text-slate-800">ログイン</h1>
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

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-slate-600">
                  パスワード
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  パスワードを忘れた？
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="パスワード"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
                {error.includes('登録されていません') && (
                  <div className="mt-1.5">
                    <Link href="/auth/signup" className="font-medium underline">
                      新規登録ページへ
                    </Link>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">または</span>
              </div>
            </div>

            <button
              onClick={handleOAuthSignIn}
              disabled={isLoading}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white disabled:opacity-50"
            >
              Googleでログイン
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-700">
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
