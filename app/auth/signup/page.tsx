'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/client';

export default function SignUpPage() {
  const auth = useAuth();
  const user = auth.user;
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState('');

  // 既にログイン済みの場合はレンダー外で遷移
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      return;
    }

    setIsLoading(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await auth.signUp({
        email,
        password,
        verificationCallbackUrl: `${origin}/auth/email-verified`,
      });

      if (result.ok) {
        setInfo('確認メールを送信しました。メール内のリンクをクリックして認証を完了してください。');
      } else {
        if (result.error === 'USER_WITH_EMAIL_ALREADY_EXISTS') {
          setError('このメールアドレスは既に登録されています');
        } else if (result.error === 'INVALID_EMAIL') {
          setError('有効なメールアドレスを入力してください');
        } else {
          setError('登録に失敗しました');
        }
      }
    } catch (_err) {
      setError('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async () => {
    setError('');
    setIsLoading(true);

    try {
      await auth.signInWithGoogle();
    } catch (_err) {
      setIsLoading(false);
      setError('Googleログインに失敗しました');
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl backdrop-blur-sm">
          <div className="mb-4 text-center">
            <h1 className="text-lg font-medium text-slate-800">アカウント作成</h1>
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
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-600">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-2.5 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="8文字以上"
                disabled={isLoading}
              />
            </div>

            {(error || info) && (
              <div
                className={`rounded-lg p-2.5 text-xs ${info ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
              >
                {error || info}
                {error.includes('既に登録されています') && (
                  <div className="mt-1.5">
                    <Link href="/auth/signin" className="font-medium underline">
                      ログインページへ
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
              {isLoading ? '登録中...' : 'アカウント作成'}
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
              onClick={handleOAuthSignUp}
              disabled={isLoading}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white disabled:opacity-50"
            >
              Googleで登録
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            既にアカウントをお持ちの方は{' '}
            <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-700">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
