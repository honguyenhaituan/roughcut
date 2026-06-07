import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await req.formData();
  const files = form
    .getAll('files')
    .filter((f): f is File => f instanceof File);
  if (!files.length)
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  const buffers = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      mimeType: f.type,
      buffer: Buffer.from(await f.arrayBuffer()),
    })),
  );
  try {
    const { article, truncated, skipped } =
      await articleService.createFromFiles(user.userId, buffers);
    return NextResponse.json({ id: article.id, truncated, skipped });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
