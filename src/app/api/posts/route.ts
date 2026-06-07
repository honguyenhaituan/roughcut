import { NextResponse } from 'next/server';
import { postService } from '@/server/services/post.service';
import { createPostSchema } from '@/server/validations/post.schema';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? undefined;
  const posts = await postService.list(query);
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const post = await postService.create(parsed.data);
  return NextResponse.json(post, { status: 201 });
}
