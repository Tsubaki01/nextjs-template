import type { Subscription } from '@/drizzle/schema';

/**
 * 許可されている Stripe サブスクリプションステータス一覧
 * @type {Subscription['status'][]}
 */
export const VALID_SUBSCRIPTION_STATUSES: Subscription['status'][] = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
];

/**
 * 与えられた値が有効な Subscription ステータスか判定します
 * @param {unknown} status - チェックしたいステータス値
 * @returns {status is Subscription['status']} 有効な場合は true
 */
export function isValidSubscriptionStatus(
  status: unknown
): status is Subscription['status'] {
  return typeof status === 'string' && (VALID_SUBSCRIPTION_STATUSES as string[]).includes(status);
}

/**
 * cancel_at（UNIX秒）を Date 型に正規化します
 * @param {unknown} cancelAt - UNIX秒で表された cancel_at
 * @returns {Date | null} 正規化された Date 型、変換できなければ null
 */
export function normalizeCancelAtSecondsToDate(cancelAt?: unknown): Date | null {
  return typeof cancelAt === 'number' ? new Date(cancelAt * 1000) : null;
}

/**
 * cancel_at_period_end の値を boolean 型に正規化します
 * @param {unknown} value - Stripe から取得した値
 * @returns {boolean} true の場合のみ true、それ以外は false
 */
export function normalizeCancelAtPeriodEnd(value?: unknown): boolean {
  return value === true;
}

/**
 * UNIX秒を Date 型に変換します
 * @param {unknown} seconds - UNIXタイムスタンプ（秒）
 * @returns {Date | null} 変換された Date、または null
 */
export function toDateOrNullFromSeconds(seconds: unknown): Date | null {
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}

