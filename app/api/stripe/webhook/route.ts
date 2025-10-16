/* eslint-disable @typescript-eslint/no-explicit-any */
// Stripe Webhookイベントの型定義が不完全なため、このファイル全体でany型の使用を許可
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/drizzle';
import { subscription, type Subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// Webhook は常に動的実行にし、キャッシュやプリレンダーを無効化
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helpers: 軽いリトライで Stripe 側の伝播遅延やイベント順序を吸収
async function wait(delayMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function retrieveSubscriptionWithRetry(
  subscriptionId: string,
  maxAttempts = 4,
  delayMs = 700
): Promise<Stripe.Subscription | null> {
  let last: Stripe.Subscription | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const sub = (await getStripe().subscriptions.retrieve(
        subscriptionId
      )) as unknown as Stripe.Subscription;
      last = sub;
      if ((sub as any)?.current_period_end) return sub;
    } catch (e) {
      if (attempt === maxAttempts) {
        console.warn('Unable to fetch subscription with retry:', (e as any)?.message || e);
      }
    }
    if (attempt < maxAttempts) await wait(delayMs);
  }
  return last;
}

async function backfillCurrentPeriodEndWhenMissing(
  userId: string,
  subscriptionId: string,
  maxAttempts = 8,
  delayMs = 1500
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const sub = (await retrieveSubscriptionWithRetry(subscriptionId, 1, delayMs)) as any;
    const cpe: number | undefined = sub?.current_period_end;
    if (cpe) {
      try {
        await db
          .update(subscription)
          .set({ currentPeriodEnd: new Date(cpe * 1000) })
          .where(eq(subscription.userId, userId));
      } catch {}
      return;
    }
    if (attempt < maxAttempts) await wait(delayMs);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // イベントタイプごとに処理
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // セッションに必要情報がある場合のみ処理
        if (session.client_reference_id && session.customer && session.subscription) {
          const userId = session.client_reference_id as string;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Stripe の Subscription を取得（リトライで current_period_end 取得を安定化）
          const sub = await retrieveSubscriptionWithRetry(subscriptionId);

          const status = (sub?.status as Subscription['status']) || 'incomplete';
          const currentPeriodEnd = (sub as any)?.current_period_end
            ? new Date(((sub as any).current_period_end as number) * 1000)
            : null;
          const cancelAt = (sub as any)?.cancel_at
            ? new Date(((sub as any).cancel_at as number) * 1000)
            : null;
          const cancelAtPeriodEnd = Boolean((sub as any)?.cancel_at_period_end);

          try {
            await db
              .insert(subscription)
              .values({
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                status,
                currentPeriodEnd,
                cancelAt,
                cancelAtPeriodEnd,
              })
              .onConflictDoUpdate({
                target: subscription.userId,
                set: {
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  status,
                  currentPeriodEnd,
                  cancelAt,
                  cancelAtPeriodEnd,
                  updatedAt: new Date(),
                },
              });
            // もし currentPeriodEnd が未確定なら、遅延再取得でバックフィル
            if (!currentPeriodEnd) {
              await backfillCurrentPeriodEndWhenMissing(userId, subscriptionId);
            }
          } catch (e: any) {
            // 一意制約衝突などの場合は既存レコードに対して update でフォールバック
            const msg = e?.message || String(e);
            console.warn('Webhook upsert failed; applying fallback update.', msg);
            await db
              .update(subscription)
              .set({
                userId,
                stripeCustomerId: customerId,
                status,
                currentPeriodEnd,
                cancelAt,
                cancelAtPeriodEnd,
                updatedAt: new Date(),
              })
              .where(eq(subscription.stripeSubscriptionId, subscriptionId));
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        const created = event.data.object as Stripe.Subscription;
        const sub = await retrieveSubscriptionWithRetry(created.id);

        const cancelAt = sub?.cancel_at ? new Date(sub.cancel_at * 1000) : null;
        const cancelAtPeriodEnd = Boolean(sub?.cancel_at_period_end);
        await db
          .update(subscription)
          .set({
            status: (sub?.status ?? created.status) as Subscription['status'],
            currentPeriodEnd: (sub as any)?.current_period_end
              ? new Date(((sub as any).current_period_end as number) * 1000)
              : (created as any).current_period_end
                ? new Date(((created as any).current_period_end as number) * 1000)
                : null,
            cancelAt,
            cancelAtPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, (sub ?? created).id));

        break;
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        // サブスクリプションのステータス/期日/解約予約を更新
        const cancelAt = stripeSubscription.cancel_at
          ? new Date(stripeSubscription.cancel_at * 1000)
          : null;
        const cancelAtPeriodEnd = Boolean(stripeSubscription.cancel_at_period_end);
        await db
          .update(subscription)
          .set({
            status: stripeSubscription.status as Subscription['status'],
            currentPeriodEnd: (stripeSubscription as any).current_period_end
              ? new Date((stripeSubscription as any).current_period_end * 1000)
              : null,
            cancelAt,
            cancelAtPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        // サブスクリプションをキャンセル済みに更新（終了日時・キャンセル実行時刻も保存）
        const canceledAt = (stripeSubscription as any).canceled_at
          ? new Date((stripeSubscription as any).canceled_at * 1000)
          : null;
        const cpeSeconds =
          (stripeSubscription as any).current_period_end ??
          (stripeSubscription as any).ended_at ??
          null;
        await db
          .update(subscription)
          .set({
            status: 'canceled',
            currentPeriodEnd: typeof cpeSeconds === 'number' ? new Date(cpeSeconds * 1000) : null,
            cancelAt: canceledAt,
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id));

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof (invoice as any).subscription === 'string'
            ? ((invoice as any).subscription as string)
            : undefined;

        if (subId) {
          // 支払い失敗をログに記録（必要に応じてメール送信などの処理を追加）
          console.error(`❌ Payment failed for subscription: ${subId}`);

          // サブスクリプションのステータスを更新
          const sub = (await getStripe().subscriptions.retrieve(
            subId
          )) as unknown as Stripe.Subscription;

          await db
            .update(subscription)
            .set({
              status: sub.status as Subscription['status'],
              updatedAt: new Date(),
            })
            .where(eq(subscription.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof (invoice as any).subscription === 'string'
            ? ((invoice as any).subscription as string)
            : undefined;

        if (subId) {
          // 支払い成功時: ステータスと次回請求日を更新
          const sub = (await getStripe().subscriptions.retrieve(
            subId
          )) as unknown as Stripe.Subscription;

          await db
            .update(subscription)
            .set({
              status: sub.status as Subscription['status'],
              currentPeriodEnd: (sub as any).current_period_end
                ? new Date((sub as any).current_period_end * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(subscription.stripeSubscriptionId, sub.id));
        }
        break;
      }

      default:
      // 未処理のイベントタイプは無視
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Stripeの生のボディを扱うため、bodyParserを無効化
export const runtime = 'nodejs';
