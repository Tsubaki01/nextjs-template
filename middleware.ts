import { NextRequest, NextResponse } from 'next/server';
import { getStackServerApp } from '@/lib/stack';

// --- CSRF: ヘルパー関数群（Next.js v15推奨のシンプルな検証方針） ---
const isStateChangingMethod = (method: string): boolean => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

const normalizeOrigin = (origin: string): string => {
  // 末尾のスラッシュを削除して正規化
  return origin.replace(/\/+$/, '');
};

const parseAllowedOrigins = (): string[] => {
  const csv = (process.env.NEXT_PUBLIC_APP_ORIGINS || '').trim();
  const single = (process.env.NEXT_PUBLIC_APP_ORIGIN || '').trim();

  // 両方の環境変数でカンマ区切りをサポート
  const list = [
    ...(csv ? csv.split(',').map((s) => s.trim()).filter(Boolean) : []),
    ...(single ? single.split(',').map((s) => s.trim()).filter(Boolean) : []),
  ];

  // 末尾のスラッシュを正規化
  return Array.from(new Set(list.map(normalizeOrigin)));
};

const getOriginFromRequest = (request: NextRequest): string | null => {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const referer = request.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

const isAllowedByFetchMetadata = (request: NextRequest): boolean => {
  // Fetch Metadata Resource Isolation: same-origin / same-site / none を許可
  // - none: ブックマークや直接URL入力など、ブラウザUIからの直接アクセス
  // - same-origin: 同一オリジンからのリクエスト
  // - same-site: 同一サイトからのリクエスト
  // ヘッダ非搭載ブラウザ互換のため、未送信時は許可
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (!secFetchSite) return true;
  return secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none';
};

/**
 * Next.js のmiddleware関数。
 *
 * - /api/配下のAPIルートに対し、CSRF対策として Origin / Referer と Fetch Metadata(Sec-Fetch-Site) を検証します。
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
    const method = request.method;
    if (isStateChangingMethod(method)) {
      const isDev = process.env.NODE_ENV !== 'production';
      const allowedOrigins = parseAllowedOrigins();

      // デバッグログ（本番環境でも出力して問題を特定）
      const secFetchSite = request.headers.get('sec-fetch-site');
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      console.log('[CSRF Debug]', {
        pathname,
        method,
        secFetchSite,
        origin,
        referer,
        allowedOrigins,
        isDev,
        envDebug: {
          NEXT_PUBLIC_APP_ORIGINS: process.env.NEXT_PUBLIC_APP_ORIGINS,
          NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN,
        },
      });

      if (!isAllowedByFetchMetadata(request)) {
        console.error('[CSRF] Blocked by Fetch Metadata', { secFetchSite });
        return new NextResponse('Forbidden (CSRF: blocked by Fetch Metadata)', { status: 403 });
      }

      if (allowedOrigins.length === 0) {
        if (!isDev) {
          console.error('Missing required env: NEXT_PUBLIC_APP_ORIGIN or NEXT_PUBLIC_APP_ORIGINS');
          return new NextResponse('Server misconfiguration', { status: 500 });
        }
        // 開発では厳密なオリジン指定が未設定でも続行
        return NextResponse.next();
      }

      const candidateOrigin = getOriginFromRequest(request);
      if (!candidateOrigin) {
        if (!isDev) {
          console.error('[CSRF] No Origin/Referer header');
          return new NextResponse('Forbidden (CSRF: no Origin/Referer)', { status: 403 });
        }
        return NextResponse.next();
      }

      // Origin比較時も正規化して比較
      const normalizedCandidateOrigin = normalizeOrigin(candidateOrigin);
      const requestOrigin = normalizeOrigin(new URL(request.url).origin);
      const isAllowedByEnv = allowedOrigins.includes(normalizedCandidateOrigin);
      const isAllowedByRequestOriginInDev = isDev && normalizedCandidateOrigin === requestOrigin;

      console.log('[CSRF Origin Check]', {
        candidateOrigin,
        normalizedCandidateOrigin,
        requestOrigin,
        isAllowedByEnv,
        isAllowedByRequestOriginInDev,
      });

      if (!isAllowedByEnv && !isAllowedByRequestOriginInDev) {
        console.error('[CSRF] Origin mismatch', {
          normalizedCandidateOrigin,
          allowedOrigins,
          requestOrigin,
        });
        return new NextResponse('Forbidden (CSRF: origin mismatch)', { status: 403 });
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
