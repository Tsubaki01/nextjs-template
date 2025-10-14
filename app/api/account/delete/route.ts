import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth/server';
import { prisma } from '@/lib/prisma';
import { deleteUser as deleteAuthUser } from '@/lib/auth/server';

// 退会API
// - 認証必須
// - サブスクリプションが「期間終了時キャンセル予約中」または「キャンセル済み」の場合のみ削除許可
// - アクティブ等で未キャンセル予約の場合は 409
// - Subscription テーブル未作成（P2021）の環境でも落とさない
// - 関連データ削除後に Neon Auth のユーザー削除（NEON_PROJECT_ID / NEON_API_TOKEN 必須）

export async function POST(_req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // サブスクリプション取得（テーブル未作成時は null 扱い）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prismaの動的スキーマのため型が不定
    let subscription: any = null;
    try {
      subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prismaエラーオブジェクトの型が不完全
    } catch (e: any) {
      if (e?.code !== 'P2021') {
        throw e;
      }
      subscription = null;
    }

    if (subscription) {
      const willCancelAtPeriodEnd = Boolean(subscription.cancelAtPeriodEnd);
      const isActiveLike = subscription.status !== 'canceled';
      if (isActiveLike && !willCancelAtPeriodEnd) {
        return NextResponse.json(
          {
            error: 'プランの解約が必要です。購読を管理からプランをキャンセルしてください。',
          },
          { status: 409 }
        );
      }
    }

    // 関連データ削除（テーブル未作成時はスキップ）
    try {
      await prisma.subscription.deleteMany({ where: { userId: user.id } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prismaエラーオブジェクトの型が不完全
    } catch (e: any) {
      if (e?.code !== 'P2021') {
        throw e;
      }
    }

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
