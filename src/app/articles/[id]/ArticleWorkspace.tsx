'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ArticleContent, Claim, Segment, Media } from '@/types';
import { replaceClaim } from '@/lib/article-content';
import { ArticleEditor } from '@/components/ArticleEditor';
import { ArticleReader } from '@/components/ArticleReader';
import { SkeletonReview, type DraftPhase } from '@/components/SkeletonReview';
import { AppHeader } from '@/components/AppHeader';
import { PublishControl } from '@/components/PublishControl';
import { SummaryBar } from '@/components/SummaryBar';
import ExportMarkdownButton from '@/components/ExportMarkdownButton';

interface ArticleRow {
  id: string;
  title: string;
  articleType: string;
  status: 'planned' | 'drafting' | 'ready';
  content: ArticleContent;
  sourceSegments: Segment[];
  media: Media[];
  published: boolean;
  publicId: string | null;
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
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  // Outline draft state — lifted from SkeletonReview so the draft action can
  // live in the app header (where the "Reviewing plan" badge used to be).
  const [planPhase, setPlanPhase] = useState<DraftPhase>('idle');
  const [planHasDraft, setPlanHasDraft] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const planDraftRef = useRef<(() => void) | null>(null);

  const registerPlanDraft = useCallback((fn: (() => void) | null) => {
    planDraftRef.current = fn;
  }, []);
  const onPlanStateChange = useCallback(
    (s: {
      phase: DraftPhase;
      hasExistingDraft: boolean;
      error: string | null;
    }) => {
      setPlanPhase(s.phase);
      setPlanHasDraft(s.hasExistingDraft);
      setPlanError(s.error);
    },
    [],
  );

  const addMediaToState = (m: Media) => setMedia((prev) => [...prev, m]);

  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // While a server-side write is running (drafting / regenerating a section),
  // autosave is suspended so an in-flight PATCH carrying stale section bodies
  // can't race the draft write and clobber it (no version guard on the row).
  const serverWriteInFlight = useRef(false);

  // Persist title + content; driven by the debounced autosave effect below.
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

  // The draft/regenerate response doesn't carry the publish fields, and
  // publishing state is unchanged by drafting — preserve it via a merge.
  const applyDrafted = useCallback(
    (updated: Omit<ArticleRow, 'published' | 'publicId'>) => {
      setArticle((prev) => ({ ...prev, ...updated }));
      setContent(updated.content as ArticleContent);
      setTitle(updated.title);
      setStatus(updated.status as 'planned' | 'drafting' | 'ready');
    },
    [],
  );

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

  // Return to the skeleton/plan view to add, remove, or relink sections.
  // Optimistic: switch the view immediately, then persist the status so a reload
  // still lands on the plan. Drafted bodies stay in `content` and are preserved.
  const editPlan = useCallback(async () => {
    setStatus('planned');
    try {
      await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'planned' }),
      });
    } catch {
      // View already switched; a failed persist only loses the "editing plan"
      // memory across a reload.
    }
  }, [article.id]);

  const headerRight =
    status === 'planned' ? (
      <>
        {planPhase === 'error' && planError && (
          <span className="hidden max-w-48 truncate text-xs text-red-600 sm:inline">
            {planError}
          </span>
        )}
        <button
          type="button"
          onClick={() => planDraftRef.current?.()}
          disabled={planPhase === 'saving' || planPhase === 'drafting'}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {planPhase === 'saving'
            ? 'Saving edits…'
            : planPhase === 'drafting'
              ? 'Writing…'
              : planHasDraft
                ? 'Save & update draft'
                : 'Draft all sections'}
        </button>
      </>
    ) : status === 'drafting' ? (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
        Drafting…
      </span>
    ) : (
      <>
        <span className="w-14 text-xs text-zinc-400" aria-live="polite">
          {saveState === 'saving'
            ? 'Saving…'
            : saveState === 'saved'
              ? 'Saved'
              : ''}
        </span>
        <SummaryBar content={content} />

        <div className="flex rounded-md border border-zinc-200 bg-white p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={editPlan}
            className="rounded px-2.5 py-1 text-zinc-600 transition hover:bg-zinc-100"
          >
            Outline
          </button>
          {(['edit', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2.5 py-1 capitalize transition ${
                mode === m
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <ExportMarkdownButton article={{ title, content, media }} />
          <PublishControl
            articleId={initial.id}
            published={initial.published}
            publicId={initial.publicId}
          />
        </div>
      </>
    );

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader back wide right={headerRight} />

      {status === 'planned' && (
        <SkeletonReview
          article={{ ...article, content, title }}
          onDrafted={applyDrafted}
          registerDraft={registerPlanDraft}
          onStateChange={onPlanStateChange}
        />
      )}

      {status === 'drafting' && (
        <div>
          <div className="mx-auto max-w-6xl px-4 pt-6">
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>
                Drafting sections… this can take a moment.
                {draftRetryError && ' Something went wrong — try again.'}
              </span>
              <button
                type="button"
                onClick={retryDraft}
                className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
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
            onMediaUploaded={addMediaToState}
            onServerWriteStart={beginServerWrite}
            onServerWriteEnd={endServerWrite}
          />
        </div>
      )}

      {status === 'ready' &&
        (mode === 'preview' ? (
          <ArticleReader title={title} content={content} media={media} />
        ) : (
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
            onMediaUploaded={addMediaToState}
            onServerWriteStart={beginServerWrite}
            onServerWriteEnd={endServerWrite}
          />
        ))}
    </div>
  );
}
