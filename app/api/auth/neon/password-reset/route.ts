import { NextResponse } from 'next/server';
import { getStackServerApp } from '@/lib/stack';

export async function POST(request: Request) {
  try {
    const { password } = (await request.json().catch(() => ({}))) as { password?: string };
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ ok: false, error: 'INVALID_PASSWORD' }, { status: 400 });
    }

    const app = getStackServerApp();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stack Auth SDKのユーザー型が不完全
    const user: any = await app.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'NO_SESSION' }, { status: 401 });
    }

    // Try multiple SDK method names for compatibility
    if (typeof user.updatePassword === 'function') {
      await user.updatePassword(password);
    } else if (typeof user.update === 'function') {
      await user.update({ password });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stack Auth SDKのAPI型が不完全
    } else if (typeof (app as any).updateUser === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stack Auth SDKのAPI型が不完全
      await (app as any).updateUser({ password });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stack Auth SDKのAPI型が不完全
    } else if (typeof (app as any).updateMe === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stack Auth SDKのAPI型が不完全
      await (app as any).updateMe({ password });
    } else {
      return NextResponse.json({ ok: false, error: 'NO_API' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- エラーオブジェクトの型が不完全
  } catch (e: any) {
    const msg = e?.message || 'UNKNOWN_ERROR';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
