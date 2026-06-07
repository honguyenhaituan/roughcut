import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { publicId } = await articleService.publish(
      (await params).id,
      user.userId,
    );
    return NextResponse.json({ publicId });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg === 'NOT_FOUND' ? 404 : 400 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await articleService.unpublish((await params).id, user.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg === 'NOT_FOUND' ? 404 : 400 },
    );
  }
}
