import { StackClientApp, StackServerApp } from '@stackframe/stack';

function ensureEnv() {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

  if (!projectId || !publishableClientKey || !secretServerKey) {
    throw new Error(
      'Stack Auth 環境変数が未設定です。NEXT_PUBLIC_STACK_PROJECT_ID / NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY / STACK_SECRET_SERVER_KEY を設定してください。'
    );
  }
  return { projectId, publishableClientKey, secretServerKey };
}

export function getStackClientApp() {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  if (!projectId || !publishableClientKey) {
    throw new Error(
      'Stack Auth クライアント環境変数が未設定です。NEXT_PUBLIC_STACK_PROJECT_ID / NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY を設定してください。'
    );
  }

  return new StackClientApp({
    projectId,
    publishableClientKey,
    tokenStore: 'nextjs-cookie',
    urls: {
      afterSignIn: '/dashboard',
      afterSignUp: '/dashboard',
      afterSignOut: '/',
      emailVerification: '/auth/email-verified',
    },
  });
}

export function getStackServerApp() {
  const { projectId, publishableClientKey, secretServerKey } = ensureEnv();
  return new StackServerApp({
    projectId,
    publishableClientKey,
    secretServerKey,
    tokenStore: 'nextjs-cookie',
    urls: {
      afterSignIn: '/dashboard',
      afterSignUp: '/dashboard',
      afterSignOut: '/',
      emailVerification: '/auth/email-verified',
    },
  });
}
