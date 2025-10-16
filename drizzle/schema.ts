import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// SubscriptionStatus enum定義（Prismaと同じ値）
export const subscriptionStatusEnum = pgEnum('SubscriptionStatus', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
]);

// Subscriptionテーブル定義
export const subscription = pgTable('Subscription', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('userId').notNull().unique(),
  stripeCustomerId: text('stripeCustomerId').notNull().unique(),
  stripeSubscriptionId: text('stripeSubscriptionId').notNull().unique(),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd', { mode: 'date', withTimezone: true }),
  cancelAt: timestamp('cancelAt', { mode: 'date', withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
});

// 型エクスポート
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
