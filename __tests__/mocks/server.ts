import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node.js環境用のMSWサーバーセットアップ
 * Vitest等のテスト実行時に使用
 */
export const server = setupServer(...handlers);
