import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';
import type { ArticleContent, Segment, Media } from '@/types';
import ArticleWorkspace from './ArticleWorkspace';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;

  const user = await getSessionUser();
  if (!user) redirect('/login');

  const a = await articleService.get(id, user.userId);
  if (!a) notFound();

  return (
    <ArticleWorkspace
      article={{
        id: a.id,
        title: a.title,
        articleType: a.articleType,
        status: a.status as 'planned' | 'drafting' | 'ready',
        content: a.content as ArticleContent,
        sourceSegments: a.sourceSegments as Segment[],
        media: a.media as Media[],
        published: a.published,
        publicId: a.publicId,
      }}
    />
  );
}
