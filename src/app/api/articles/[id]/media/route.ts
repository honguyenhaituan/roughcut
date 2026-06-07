import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

export const maxDuration = 30;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File))
    return NextResponse.json({ error: 'No file' }, { status: 400 });

  try {
    const item = await articleService.addMedia((await params).id, user.userId, {
      name: file.name,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
    });
    return NextResponse.json(item);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg === 'NOT_FOUND' ? 404 : 422 },
    );
  }
}
