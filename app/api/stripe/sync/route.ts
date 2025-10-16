/* eslint-disable @typescript-eslint/no-explicit-any */
// Stripe SDKの型定義が不完全なため、このファイル全体でany型の使用を許可
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, extractCurrentPeriodEndSeconds } from '@/lib/stripe';
import { db } from '@/lib/drizzle';
import { subscription, type Subscription } from '@/drizzle/schema';
import { getServerUser } from '@/lib/auth/server';
import {
  isValidSubscriptionStatus,
  normalizeCancelAtSecondsToDate,
  normalizeCancelAtPeriodEnd,
  toDateOrNullFromSeconds,
} from '@/lib/stripe/validation';

// フォールバック用: Checkout からの戻り時に、webhook 未反映でも DB を同期待ち/更新する
export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: '無効な JSON ボディです' }, { status: 400 });
    }

    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : '';
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId が必要です' }, { status: 400 });
    }

    // Checkout セッションを取得
    const session = await getStripe().checkout.sessions.retrieve(sessionId as string);

    // セッションの所有者を確認（改ざん防止）
    if (session.client_reference_id !== user.id) {
      return NextResponse.json({ error: '不正なリクエストです' }, { status: 403 });
    }

    if (!session.subscription || !session.customer) {
      return NextResponse.json(
        { error: 'サブスクリプション情報が見つかりません' },
        { status: 404 }
      );
    }

    const stripeSubscription = await getStripe().subscriptions.retrieve(
      session.subscription as string
    );
    // Stripeレスポンスの検証
    if (!isValidSubscriptionStatus((stripeSubscription as any)?.status)) {
      return NextResponse.json(
        { error: '無効なサブスクリプションステータスです' },
        { status: 400 }
      );
    }

    // 各値を正規化（undefined を DB に流さない）
    const cpeSeconds = extractCurrentPeriodEndSeconds(stripeSubscription as any);
    const currentPeriodEnd = toDateOrNullFromSeconds(cpeSeconds);
    const cancelAt = normalizeCancelAtSecondsToDate((stripeSubscription as any)?.cancel_at);
    const cancelAtPeriodEnd = normalizeCancelAtPeriodEnd(
      (stripeSubscription as any)?.cancel_at_period_end
    );
    const validatedStatus = (stripeSubscription as any).status as Subscription['status'];

    // DB をアップサート
    const saved = await db
      .insert(subscription)
      .values({
        userId: user.id,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status: validatedStatus,
        currentPeriodEnd,
        cancelAt,
        cancelAtPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscription.userId,
        set: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          status: validatedStatus,
          currentPeriodEnd,
          cancelAt,
          cancelAtPeriodEnd,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ subscription: saved[0] });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: '同期に失敗しました' }, { status: 500 });
  }
}
