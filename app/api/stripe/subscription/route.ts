import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { db } from '@/lib/drizzle';
import { subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーのサブスクリプション情報を取得
    const result = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user.id))
      .limit(1);

    const sub = result[0];

    if (!sub) {
      return NextResponse.json({ subscription: null });
    }

    const payload = {
      id: sub.id,
      status: sub.status,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      currentPeriodEnd: sub.currentPeriodEnd ?? null,
      cancelAt: sub.cancelAt ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    };

    return NextResponse.json({ subscription: payload });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}
