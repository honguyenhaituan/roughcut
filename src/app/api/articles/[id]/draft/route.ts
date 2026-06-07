import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { sectionIds } = await req.json().catch(() => ({}));
  try {
    const updated = await articleService.draftSections(
      (await params).id,
      user.userId,
      sectionIds,
    );
    return NextResponse.json(updated);
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      { error: msg },
      { status: msg === 'NOT_FOUND' ? 404 : 500 },
    );
  }
}
