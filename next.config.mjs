import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 必須環境変数チェック（テスト/CIのユースケースではスキップ可）
const isTestLike = process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.PLAYWRIGHT;
if (!isTestLike) {
  const appOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN || '').trim();
  if (!appOrigin) {
    throw new Error('Missing required env NEXT_PUBLIC_APP_ORIGIN. Set it to your site origin, e.g. https://example.com');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Provide a stub for '@stackframe/stack' when the package is not installed
    let hasStack = true;
    try {
      // Resolve actual package; if not installed, fall back to local stubs
      require.resolve('@stackframe/stack');
    } catch {
      hasStack = false;
    }
    if (!hasStack) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['@stackframe/stack'] = path.resolve(
        __dirname,
        'stubs/stackframe-stack.ts'
      );
      config.resolve.alias['@/lib/stack'] = path.resolve(__dirname, 'stubs/lib-stack.ts');
    }
    return config;
  },
};

export default nextConfig;
