'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ArticleContent, Claim, Segment, Media } from '@/types';
import { replaceClaim } from '@/lib/article-content';
import { ArticleEditor } from '@/components/ArticleEditor';
import { SkeletonReview } from '@/components/SkeletonReview';

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
}

type SaveState = 'idle' | 'saving' | 'saved';

export default function ArticleWorkspace({ article: initial }: Props) {
  const [article, setArticle] = useState<ArticleRow>(initial);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState<ArticleContent>(initial.content);
  const [status, setStatus] = useState(initial.status);
  const [media, setMedia] = useState<Media[]>(initial.media);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const addMediaToState = (m: Media) => setMedia((prev) => [...prev, m]);

  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Explicit save — also used by SummaryBar's Save button
  const doSave = useCallback(async () => {
    setSaveState('saving');
    try {
      await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  }, [article.id, title, content]);

  // Debounced autosave whenever title or content changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // doSave is excluded intentionally — we only want to trigger on data changes,
    // not on the stable callback reference updating. The callback always captures
    // the latest title/content via its own closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const onClaimChange = useCallback(
    (c: Claim) => setContent((prev) => replaceClaim(prev, c)),
    [],
  );

  const patchContent = useCallback(
    (next: ArticleContent) => setContent(next),
    [],
  );

  const handleDrafted = (updated: ArticleRow) => {
    setArticle(updated);
    setContent(updated.content as ArticleContent);
    setTitle(updated.title);
    setStatus(updated.status as 'planned' | 'drafting' | 'ready');
  };

  return (
    <div className="relative min-h-screen bg-zinc-50">
      {/* Saving indicator */}
      {saveState !== 'idle' && (
        <div className="fixed top-4 right-4 z-50 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 shadow-sm">
          {saveState === 'saving' ? 'Saving…' : 'Saved'}
        </div>
      )}

      {status === 'planned' && (
        <SkeletonReview
          article={{ ...article, content, title }}
          onDrafted={handleDrafted}
        />
      )}

      {status === 'drafting' && (
        <div>
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Drafting sections… refresh to check progress.
            </div>
          </div>
          <ArticleEditor
            article={article}
            title={title}
            content={content}
            media={media}
            selectedClaim={selectedClaim}
            onTitleChange={setTitle}
            onClaimChange={onClaimChange}
            onSelect={setSelectedClaim}
            patchContent={patchContent}
            onSave={doSave}
            onMediaUploaded={addMediaToState}
          />
        </div>
      )}

      {status === 'ready' && (
        <ArticleEditor
          article={article}
          title={title}
          content={content}
          media={media}
          selectedClaim={selectedClaim}
          onTitleChange={setTitle}
          onClaimChange={onClaimChange}
          onSelect={setSelectedClaim}
          patchContent={patchContent}
          onSave={doSave}
          onMediaUploaded={addMediaToState}
        />
      )}
    </div>
  );
}
