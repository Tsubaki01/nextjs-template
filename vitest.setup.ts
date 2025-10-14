import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './__tests__/mocks/server';

// MSWサーバーの起動
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// 各テスト後にハンドラーをリセット
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// テスト終了時にMSWサーバーを停止
afterAll(() => {
  server.close();
});
