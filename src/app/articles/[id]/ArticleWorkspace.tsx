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
  const [draftRetryError, setDraftRetryError] = useState(false);

  const addMediaToState = (m: Media) => setMedia((prev) => [...prev, m]);

  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // While a server-side write is running (drafting / regenerating a section),
  // autosave is suspended so an in-flight PATCH carrying stale section bodies
  // can't race the draft write and clobber it (no version guard on the row).
  const serverWriteInFlight = useRef(false);

  // Explicit save — also used by SummaryBar's Save button
  const doSave = useCallback(async () => {
    if (serverWriteInFlight.current) return;
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

  const beginServerWrite = useCallback(() => {
    serverWriteInFlight.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);
  const endServerWrite = useCallback(() => {
    serverWriteInFlight.current = false;
  }, []);

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

  const applyDrafted = useCallback((updated: ArticleRow) => {
    setArticle(updated);
    setContent(updated.content as ArticleContent);
    setTitle(updated.title);
    setStatus(updated.status as 'planned' | 'drafting' | 'ready');
  }, []);

  // Recovery for #2: if a draft run was interrupted (e.g. serverless timeout)
  // the row can be left in `drafting`; let the user re-trigger it.
  const retryDraft = useCallback(async () => {
    setDraftRetryError(false);
    setStatus('drafting');
    beginServerWrite();
    try {
      const res = await fetch(`/api/articles/${article.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('draft failed');
      applyDrafted((await res.json()) as ArticleRow);
    } catch {
      setDraftRetryError(true);
    } finally {
      endServerWrite();
    }
  }, [article.id, applyDrafted, beginServerWrite, endServerWrite]);

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
          onDrafted={applyDrafted}
        />
      )}

      {status === 'drafting' && (
        <div>
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>
                Drafting sections… this can take a moment.
                {draftRetryError && ' Something went wrong — try again.'}
              </span>
              <button
                type="button"
                onClick={retryDraft}
                className="shrink-0 rounded border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                Retry drafting
              </button>
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
            onServerWriteStart={beginServerWrite}
            onServerWriteEnd={endServerWrite}
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
          onServerWriteStart={beginServerWrite}
          onServerWriteEnd={endServerWrite}
        />
      )}
    </div>
  );
}
