import { NextRequest, NextResponse } from 'next/server';
import { getStackServerApp } from '@/lib/stack';

/**
 * Next.js のmiddleware関数。
 *
 * - /api/配下のAPIルートに対し、CSRF対策としてOrigin/Referer/Sec-Fetch-Siteを検証し、不正なクロスサイトリクエストを拒否します。
 * - /handler/password-resetを、独自のパスワードリセットページにリダイレクトします（ただしresumeフラグを除く）。
 * - /dashboard, /billing配下へのアクセス時、Stack Authでログイン済みかどうかを確認し、未ログインならサインアップページへリダイレクトします。
 *
 * @param {NextRequest} request リクエストオブジェクト
 * @returns {Promise<NextResponse>} レスポンス
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  // --- APIルートへのCSRF対策 ---
  if (pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase();
    // 安全でないメソッド時のみCSRFチェックを行う
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // 許可されたオリジン: 環境変数のみを使用（Hostヘッダは信用しない）
      const allowedOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN || '').trim();
      if (!allowedOrigin) {
        console.error('Missing required env: NEXT_PUBLIC_APP_ORIGIN');
        return new NextResponse('Server misconfiguration', { status: 500 });
      }
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const secFetchSite = request.headers.get('sec-fetch-site');

      // Sec-Fetch-Siteヘッダーが存在する場合は「same-origin」のみ許可
      if (secFetchSite && secFetchSite !== 'same-origin') {
        // same-origin 以外（same-site を含む）は拒否
        return new NextResponse('Forbidden (CSRF: not same-origin)', { status: 403 });
      }

      // Originヘッダー優先で検証（なければRefererのoriginを利用）
      if (origin) {
        if (origin !== allowedOrigin) {
          return new NextResponse('Forbidden (CSRF: origin mismatch)', { status: 403 });
        }
      } else if (referer) {
        try {
          const refOrigin = new URL(referer).origin;
          if (refOrigin !== allowedOrigin) {
            return new NextResponse('Forbidden (CSRF: referer mismatch)', { status: 403 });
          }
        } catch {
          // Refererヘッダーのパースに失敗した場合も拒否
          return new NextResponse('Forbidden (CSRF: bad referer)', { status: 403 });
        }
      } else {
        // Origin/Refererどちらも存在しない場合は、保守的に拒否
        return new NextResponse('Forbidden (CSRF: no origin)', { status: 403 });
      }
    }
  }

  // --- 標準パスワードリセット画面を独自ページへリダイレクトする ---
  if (pathname === '/handler/password-reset' && !searchParams.get('resume')) {
    // /handler/password-reset?resume=xxx 以外は /auth/neon-password-reset へリダイレクト
    const u = request.nextUrl.clone();
    u.pathname = '/auth/neon-password-reset';
    return NextResponse.redirect(u);
  }

  // --- 認証が必要なページへのアクセス制御 ---
  // /dashboard または /billing配下の場合、未認証ユーザーをサインアップページへリダイレクト
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/billing')) {
    try {
      const app = getStackServerApp();
      const user = await app.getUser();
      if (!user) {
        // サインアップページにリダイレクト
        return NextResponse.redirect(new URL('/auth/signup', request.url));
      }
    } catch (err) {
      // 設定不足のみ（かつ非本番のみ）認証スキップ。その他は401を返却。
      const error = err as { name?: string; message?: string; stack?: string } | undefined;
      const errorName = error?.name ?? 'Error';
      const errorMessage = error?.message ?? 'Unknown error';
      const errorStack = error?.stack;

      // 既知の設定系エラー名
      const isKnownConfigError =
        errorName === 'ConfigError' || errorName === 'ConfigurationError' || errorName === 'MissingEnvError';

      // 必須環境変数の不足を個別に確認（ホワイトリスト方式）
      const requiredEnvVars = [
        'NEXT_PUBLIC_STACK_PROJECT_ID',
        'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
        'STACK_SECRET_SERVER_KEY',
      ] as const;
      const missingEnvVars = requiredEnvVars.filter((key) => !(`${process.env[key] || ''}`.trim()));

      const isNonProduction = process.env.NODE_ENV !== 'production';
      const isConfigProblem = isKnownConfigError || missingEnvVars.length > 0;

      if (isNonProduction && isConfigProblem) {
        console.warn(
          'Stack Authの設定不足により、非本番環境で認証チェックをスキップします',
          {
            name: errorName,
            message: errorMessage,
            stack: errorStack,
            missingEnvVars,
            nodeEnv: process.env.NODE_ENV,
          }
        );
        // スキップして続行（開発利便性のため）
        return NextResponse.next();
      }

      console.error(
        'Stack Authのランタイム/APIエラーとして認証を失敗扱い（401を返却）',
        {
          name: errorName,
          message: errorMessage,
          stack: errorStack,
          missingEnvVars,
          nodeEnv: process.env.NODE_ENV,
        }
      );
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // 何もなければそのまま次へ
  return NextResponse.next();
}

/**
 * ミドルウェアの適用対象を定義
 * - /api/配下
 * - /dashboard/配下
 * - /billing/配下
 * - /handler/password-reset
 */
export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/billing/:path*', '/handler/password-reset'],
};
