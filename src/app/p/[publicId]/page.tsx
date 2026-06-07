import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { articleService } from '@/server/services/article.service';
import { ArticleReader } from '@/components/ArticleReader';

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const a = await articleService.getPublic(publicId);
  if (!a)
    return { title: 'Not found', robots: { index: false, follow: false } };
  const hero = a.media.find((m) => m.id === a.content.heroImageId)?.src;
  const description = a.content.hookSubtitle.text || undefined;
  return {
    title: a.title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: a.title,
      description,
      images: hero ? [hero] : undefined,
    },
  };
}

export default async function PublicArticlePage({ params }: Props) {
  const { publicId } = await params;
  const a = await articleService.getPublic(publicId);
  if (!a) notFound();

  return (
    <div className="min-h-screen bg-white">
      <ArticleReader title={a.title} content={a.content} media={a.media} />
    </div>
  );
}
