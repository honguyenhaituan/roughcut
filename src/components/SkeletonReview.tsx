'use client';

import { useMemo, useState } from 'react';
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

type Section = ArticleContent['sections'][number];

type DraftPhase = 'idle' | 'saving' | 'drafting' | 'error';

export function SkeletonReview({ article, onDrafted }: Props) {
  const { content: initialContent } = article;

  // Local editable copy of content
  const [sections, setSections] = useState<Section[]>(initialContent.sections);
  const [phase, setPhase] = useState<DraftPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  // Segments not assigned to any section — computed regardless of isTravelExperience
  // so hooks always run in the same order.
  const unassignedSegments = useMemo(() => {
    const assigned = new Set(sections.flatMap((s) => s.sourceSegmentIds));
    return article.sourceSegments.filter((seg) => !assigned.has(seg.id));
  }, [sections, article.sourceSegments]);

  const updateSection = (id: string, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        heading: 'New section',
        intent: '',
        sourceSegmentIds: [],
        body: [],
        imageId: null,
      },
    ]);
  };

  const toggleSegment = (sectionId: string, segmentId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const has = s.sourceSegmentIds.includes(segmentId);
        return {
          ...s,
          sourceSegmentIds: has
            ? s.sourceSegmentIds.filter((x) => x !== segmentId)
            : [...s.sourceSegmentIds, segmentId],
        };
      }),
    );
  };

  const handleDraftAll = async () => {
    setPhase('saving');
    setError(null);
    try {
      // Persist edits to the skeleton before drafting
      const editedContent: ArticleContent = { ...initialContent, sections };
      const saveRes = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!saveRes.ok) {
        const j = (await saveRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(j.error ?? 'Failed to save edits');
      }

      setPhase('drafting');
      const draftRes = await fetch(`/api/articles/${article.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!draftRes.ok) {
        const j = (await draftRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(j.error ?? 'Drafting failed');
      }
      const updated = (await draftRes.json()) as ArticleRow;
      onDrafted(updated);
    } catch (e) {
      setError((e as Error).message);
      setPhase('error');
    }
  };

  const inFlight = phase === 'saving' || phase === 'drafting';

  if (!initialContent.isTravelExperience) {
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
        <p className="mt-2 text-sm text-zinc-500">
          Review and adjust the article plan before drafting.
        </p>
      </div>

      {/* Sections */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
          Planned sections
        </h2>
        <ol className="space-y-4">
          {sections.map((s, i) => (
            <SectionEditor
              key={s.id}
              section={s}
              index={i}
              total={sections.length}
              allSegments={article.sourceSegments}
              onUpdate={(patch) => updateSection(s.id, patch)}
              onMove={(dir) => moveSection(i, dir)}
              onRemove={() => removeSection(s.id)}
              onToggleSegment={(segId) => toggleSegment(s.id, segId)}
            />
          ))}
        </ol>

        <button
          type="button"
          onClick={addSection}
          className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 py-2 text-sm text-zinc-500 transition hover:border-zinc-400 hover:bg-zinc-50"
        >
          + Add section
        </button>
      </section>

      {/* Unassigned segments hint */}
      {unassignedSegments.length > 0 && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold text-amber-700">
            {unassignedSegments.length} unassigned note segment
            {unassignedSegments.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-0.5">
            {unassignedSegments.map((seg) => (
              <li key={seg.id} className="text-xs text-amber-600">
                <span className="font-medium">{seg.fileName}</span> —{' '}
                {seg.text.slice(0, 80)}
                {seg.text.length > 80 ? '…' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Counts preview */}
      <div className="mb-8 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {initialContent.keyFacts.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Key facts</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {initialContent.bestFor.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Best for</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-semibold text-zinc-800">
            {initialContent.openQuestions.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Open questions</p>
        </div>
      </div>

      {/* Draft CTA */}
      {(phase === 'error' || error) && (
        <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleDraftAll}
        disabled={inFlight}
        className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
      >
        {phase === 'saving'
          ? 'Saving edits…'
          : phase === 'drafting'
            ? 'Writing your article…'
            : 'Draft all sections'}
      </button>
      {inFlight && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          {phase === 'saving'
            ? 'Persisting your edits…'
            : 'This takes about 30–60 seconds.'}
        </p>
      )}
    </div>
  );
}

// --- Sub-component ---

interface SectionEditorProps {
  section: Section;
  index: number;
  total: number;
  allSegments: Segment[];
  onUpdate: (patch: Partial<Section>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onToggleSegment: (segmentId: string) => void;
}

function SectionEditor({
  section,
  index,
  total,
  allSegments,
  onUpdate,
  onMove,
  onRemove,
  onToggleSegment,
}: SectionEditorProps) {
  const [segmentsOpen, setSegmentsOpen] = useState(false);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
          {index + 1}
        </span>

        {/* Reorder */}
        <div className="flex gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
        </div>

        <div className="flex-1" />

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-zinc-300 hover:text-red-400"
          title="Remove section"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 p-3">
        {/* Heading */}
        <input
          type="text"
          value={section.heading}
          onChange={(e) => onUpdate({ heading: e.target.value })}
          placeholder="Section heading"
          className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm font-medium text-zinc-800 outline-none focus:border-zinc-400 focus:ring-0"
        />

        {/* Intent */}
        <textarea
          value={section.intent}
          onChange={(e) => onUpdate({ intent: e.target.value })}
          placeholder="What this section should cover…"
          rows={2}
          className="w-full resize-none rounded border border-zinc-200 px-2 py-1.5 text-sm text-zinc-600 outline-none focus:border-zinc-400 focus:ring-0"
        />

        {/* Segments */}
        <div>
          <button
            type="button"
            onClick={() => setSegmentsOpen((o) => !o)}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            {section.sourceSegmentIds.length} note segment
            {section.sourceSegmentIds.length !== 1 ? 's' : ''} assigned —{' '}
            {segmentsOpen ? 'hide' : 'edit'}
          </button>

          {segmentsOpen && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded border border-zinc-100 bg-zinc-50 p-2">
              {allSegments.map((seg) => {
                const checked = section.sourceSegmentIds.includes(seg.id);
                return (
                  <li key={seg.id}>
                    <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-600">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSegment(seg.id)}
                        className="mt-0.5 shrink-0 accent-zinc-700"
                      />
                      <span>
                        <span className="font-medium">{seg.fileName}</span> —{' '}
                        {seg.text.slice(0, 100)}
                        {seg.text.length > 100 ? '…' : ''}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
