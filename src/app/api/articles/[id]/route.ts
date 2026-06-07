import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const article = await articleService.get((await params).id, user.userId);
  return article
    ? NextResponse.json(article)
    : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  try {
    const updated = await articleService.update(
      (await params).id,
      user.userId,
      body,
    );
    return NextResponse.json(updated);
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
  await articleService.remove((await params).id, user.userId);
  return NextResponse.json({ ok: true });
}
