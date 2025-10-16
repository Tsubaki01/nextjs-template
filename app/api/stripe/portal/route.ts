import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/drizzle';
import { subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(_req: NextRequest) {
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

    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 });
    }

    // return_urlの確認
    const returnUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/billing`
      : 'http://localhost:3002/billing';

    // Stripeカスタマーポータルセッションを作成
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- エラーオブジェクトの型が不完全
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      {
        error: 'エラーが発生しました',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
