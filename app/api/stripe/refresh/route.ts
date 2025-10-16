import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { db } from '@/lib/drizzle';
import { subscription, type Subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getStripe, extractCurrentPeriodEndSeconds } from '@/lib/stripe';

export async function POST(_req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const result = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user.id))
      .limit(1);

    const local = result[0];

    if (!local?.stripeSubscriptionId) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 });
    }

    const remote = await getStripe().subscriptions.retrieve(local.stripeSubscriptionId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDKの型定義が不完全
    const cpe = extractCurrentPeriodEndSeconds(remote as any);
    const currentPeriodEnd = cpe ? new Date(cpe * 1000) : null;
    const cancelAt = remote.cancel_at ? new Date(remote.cancel_at * 1000) : null;
    const cancelAtPeriodEnd = Boolean(remote.cancel_at_period_end);

    await db
      .update(subscription)
      .set({
        status: remote.status as Subscription['status'],
        currentPeriodEnd,
        cancelAt,
        cancelAtPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, local.id));

    const updated = await db
      .select()
      .from(subscription)
      .where(eq(subscription.id, local.id))
      .limit(1);

    return NextResponse.json({ subscription: updated[0] });
  } catch (error) {
    console.error('Refresh subscription error:', error);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
