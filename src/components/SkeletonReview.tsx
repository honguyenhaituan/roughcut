'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArticleContent, Segment, Media } from '@/types';

interface ArticleRow {
  id: string;
  title: string;
  articleType: string;
  status: 'planned' | 'drafting' | 'ready';
  content: ArticleContent;
  sourceSegments: Segment[];
  media: Media[];
}

interface Props {
  article: ArticleRow;
  onDrafted: (updated: ArticleRow) => void;
}

export function SkeletonReview({ article, onDrafted }: Props) {
  const { content } = article;
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!content.isTravelExperience) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-2 text-lg font-medium text-zinc-800">
          These notes don&apos;t look like a travel experience.
        </p>
        <p className="mb-6 text-sm text-zinc-500">
          Nothing has been fabricated — we only plan articles from travel notes.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          ← Start over
        </Link>
      </div>
    );
  }

  const handleDraftAll = async () => {
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch(`/api/articles/${article.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'Drafting failed');
      }
      const updated = (await res.json()) as ArticleRow;
      onDrafted(updated);
    } catch (e) {
      setError((e as Error).message);
      setDrafting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {article.articleType}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {article.title}
        </h1>
      </div>

      {/* Section skeleton */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Planned sections
        </h2>
        <ol className="space-y-3">
          {content.sections.map((s, i) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-zinc-800">{s.heading}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{s.intent}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {s.sourceSegmentIds.length} note segment
                  {s.sourceSegmentIds.length !== 1 ? 's' : ''} assigned
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Counts preview */}
      <div className="mb-8 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {content.keyFacts.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Key facts</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {content.bestFor.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Best for</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {content.openQuestions.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Open questions</p>
        </div>
      </div>

      {/* Draft CTA */}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleDraftAll}
        disabled={drafting}
        className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
      >
        {drafting ? 'Writing your article…' : 'Draft all sections'}
      </button>
      {drafting && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          This takes about 30–60 seconds.
        </p>
      )}
    </div>
  );
}
