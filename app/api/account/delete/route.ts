import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { db } from '@/lib/drizzle';
import { subscription } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { deleteUser as deleteAuthUser } from '@/lib/auth/server';

// 退会API
// - 認証必須
// - サブスクリプションが「期間終了時キャンセル予約中」または「キャンセル済み」の場合のみ削除許可
// - アクティブ等で未キャンセル予約の場合は 409
// - 関連データ削除後に Neon Auth のユーザー削除（NEON_PROJECT_ID / NEON_API_TOKEN 必須）

export async function POST(_req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // サブスクリプション取得
    const result = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, user.id))
      .limit(1);

    const sub = result[0];

    if (sub) {
      const willCancelAtPeriodEnd = Boolean(sub.cancelAtPeriodEnd);
      const isActiveLike = sub.status !== 'canceled';
      if (isActiveLike && !willCancelAtPeriodEnd) {
        return NextResponse.json(
          {
            error: 'プランの解約が必要です。購読を管理からプランをキャンセルしてください。',
          },
          { status: 409 }
        );
      }
    }

    // 関連データ削除
    await db.delete(subscription).where(eq(subscription.userId, user.id));

    // 認証プロバイダ側のユーザー削除（アダプタ経由）
    const del = await deleteAuthUser(user.id);
    if (!del.ok) {
      const status = del.status ?? 502;
      return NextResponse.json({ error: del.error || 'ユーザー削除に失敗しました' }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}
