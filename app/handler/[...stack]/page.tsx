/* eslint-disable @typescript-eslint/no-explicit-any */
// Stack Auth SDKの型定義が不完全なため、any型の使用を許可
import * as Stack from '@stackframe/stack';
import { getStackServerApp } from '@/lib/stack';

export default async function HandlerPage(props: {
  params: Promise<{ stack?: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const app = getStackServerApp();
  const StackHandler: any = (Stack as any).StackHandler;
  if (typeof StackHandler === 'function') {
    return <StackHandler app={app} fullPage routeProps={props} />;
  }
  return null;
}
