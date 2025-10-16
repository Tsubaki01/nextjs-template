/**
 * データベース接続とクライアントの設定
 *
 * このモジュールでは、PostgreSQLデータベースへの接続を確立し、
 * Drizzle ORMを使用してデータベース操作を行うためのクライアントを設定します。
 *
 * @module db
 */

import * as schema from '@/drizzle/schema';
import { drizzle } from 'drizzle-orm/neon-serverless';

// データベース接続文字列を環境変数から取得
const connectionString = process.env.DATABASE_URL;

// DATABASE_URLの存在を明示的に検証
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// データベース接続
export const db = drizzle(connectionString, {
  schema: { ...schema },
});

// データベース接続型
export type DatabaseType = typeof db;
// トランザクション型
export type TransactionType = Parameters<
  Parameters<DatabaseType['transaction']>[0]
>[0];
