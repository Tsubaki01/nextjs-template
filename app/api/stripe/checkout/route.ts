import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { getStripe, STRIPE_PRICE_ID } from '@/lib/stripe';
import { db } from '@/lib/drizzle';
import { subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();

    if (!user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { priceId } = await req.json().catch(() => ({}) as { priceId?: string });

    // 既存のカスタマーを確認
    let customerId: string | undefined;
    const result = await db
      .select({ stripeCustomerId: subscription.stripeCustomerId })
      .from(subscription)
      .where(eq(subscription.userId, user.id))
      .limit(1);

    const existingSubscription = result[0];

    if (existingSubscription) {
      customerId = existingSubscription.stripeCustomerId;
    }

    // 成功/キャンセルURLのベースを決定（env or リクエストURLから）
    const reqUrl = new URL(req.url);
    const baseUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl =
      baseUrlEnv && /^https?:\/\//i.test(baseUrlEnv)
        ? baseUrlEnv
        : `${reqUrl.protocol}//${reqUrl.host}`;

    // Stripe Checkout セッションを作成
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // 成功時に Checkout の session_id をクエリに含める（Webhook 遅延時のフォールバック用）
      success_url: `${baseUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}
