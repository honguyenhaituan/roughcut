'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  /** Expose the draft trigger to the parent so the action can live in the header. */
  registerDraft: (fn: (() => void) | null) => void;
  /** Report draft phase/state so the header button can reflect it. */
  onStateChange: (state: PlanState) => void;
}

type Section = ArticleContent['sections'][number];

export type DraftPhase = 'idle' | 'saving' | 'drafting' | 'error';

interface PlanState {
  phase: DraftPhase;
  hasExistingDraft: boolean;
  error: string | null;
}

export function SkeletonReview({
  article,
  onDrafted,
  registerDraft,
  onStateChange,
}: Props) {
  const { content: initialContent } = article;

  const [sections, setSections] = useState<Section[]>(initialContent.sections);
  const [phase, setPhase] = useState<DraftPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  // Which section's notes are highlighted in the source-notes rail.
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId],
  );

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

  const handleDraftAll = useCallback(async () => {
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
      // Only draft sections without a body — returning to the plan after an
      // initial draft must not overwrite sections the user already has. On a
      // fresh plan every body is empty, so this drafts everything as before.
      const emptyIds = sections
        .filter((s) => s.body.length === 0)
        .map((s) => s.id);
      const draftRes = await fetch(`/api/articles/${article.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds: emptyIds }),
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
  }, [article.id, initialContent, sections, onDrafted]);

  // Returning to the plan after drafting — at least one section already has prose.
  const hasExistingDraft = sections.some((s) => s.body.length > 0);

  // Surface the draft trigger + state to the parent so the action button can
  // live in the global header (where "Reviewing plan" used to be).
  useEffect(() => {
    registerDraft(handleDraftAll);
    return () => registerDraft(null);
  }, [registerDraft, handleDraftAll]);

  useEffect(() => {
    onStateChange({ phase, hasExistingDraft, error });
  }, [phase, hasExistingDraft, error, onStateChange]);

  if (!initialContent.isTravelExperience) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {article.articleType}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {article.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          This is the outline we&apos;ll write from. Adjust each section and
          what it should cover, then draft. The source notes on the right are
          everything we have to work with — hover a section to see which notes
          feed it.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: the plan */}
        <div className="min-w-0 flex-1 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              Planned sections
            </h2>
            <ol className="space-y-3">
              {sections.map((s, i) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  index={i}
                  total={sections.length}
                  allSegments={article.sourceSegments}
                  isActive={activeSectionId === s.id}
                  onActivate={() => setActiveSectionId(s.id)}
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-1 text-xs font-semibold text-amber-800">
                {unassignedSegments.length} note
                {unassignedSegments.length !== 1 ? 's' : ''} not used in any
                section yet
              </p>
              <p className="mb-2 text-xs text-amber-700">
                Link them to a section above (via “Edit links”) so their details
                make it into the article.
              </p>
              <ul className="space-y-1">
                {unassignedSegments.map((seg) => (
                  <li key={seg.id} className="text-xs text-amber-700">
                    <span className="font-medium">{seg.id}</span> ·{' '}
                    {seg.fileName} — {seg.text.slice(0, 80)}
                    {seg.text.length > 80 ? '…' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What else we extracted */}
          <section>
            <h2 className="mb-1 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              Also pulled from your notes
            </h2>
            <p className="mb-3 text-xs text-zinc-400">
              These travel with the article and help readers find it. You can
              refine them after drafting.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <ExtractCard
                n={initialContent.keyFacts.length}
                label="Key facts"
                hint="Prices, hours, logistics"
              />
              <ExtractCard
                n={initialContent.bestFor.length}
                label="Good for"
                hint="Who this trip suits"
              />
              <ExtractCard
                n={initialContent.openQuestions.length}
                label="Open questions"
                hint="Gaps we'll flag"
              />
            </div>
          </section>
        </div>

        {/* Right: source notes (references) */}
        <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-96">
          <SourceNotesRail
            segments={article.sourceSegments}
            activeSection={activeSection}
            onClear={() => setActiveSectionId(null)}
          />
        </aside>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ExtractCard({
  n,
  label,
  hint,
}: {
  n: number;
  label: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-2xl font-semibold text-zinc-800">{n}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-600">{label}</p>
      <p className="text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

interface RailProps {
  segments: Segment[];
  activeSection: Section | null;
  onClear: () => void;
}

function SourceNoteItem({ seg, linked }: { seg: Segment; linked: boolean }) {
  return (
    <li
      className={`rounded-lg border p-3 transition ${
        linked
          ? 'border-zinc-300 bg-zinc-50 shadow-sm'
          : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
          {seg.id}
        </span>
        <span className="truncate text-xs text-zinc-400">{seg.fileName}</span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-700">{seg.text}</p>
    </li>
  );
}

export function SourceNotesRail({
  segments,
  activeSection,
  onClear,
}: RailProps) {
  // Track which section the user expanded so we can re-collapse on section change.
  const [expandedForSection, setExpandedForSection] = useState<string | null>(
    null,
  );
  const showAll =
    expandedForSection !== null && expandedForSection === activeSection?.id;

  const linkedIds = new Set(activeSection?.sourceSegmentIds ?? []);
  const linked = activeSection
    ? segments.filter((s) => linkedIds.has(s.id))
    : [];
  const rest = activeSection
    ? segments.filter((s) => !linkedIds.has(s.id))
    : segments;
  const visibleRest = activeSection && !showAll ? [] : rest;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Source notes
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            {segments.length} from your upload
          </p>
        </div>
        {activeSection && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-200"
            title="Stop highlighting"
          >
            <span className="max-w-32 truncate align-middle">
              {activeSection.heading || 'Untitled section'}
            </span>{' '}
            ✕
          </button>
        )}
      </div>

      {segments.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-400">
          No source notes were extracted.
        </p>
      ) : (
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto p-3 lg:max-h-[calc(100vh-11rem)]">
          {activeSection && linked.length === 0 && (
            <li className="px-1 py-2 text-xs text-zinc-400">
              No notes linked to this section.
            </li>
          )}
          {linked.map((seg) => (
            <SourceNoteItem key={seg.id} seg={seg} linked />
          ))}

          {activeSection && rest.length > 0 && (
            <li>
              <button
                type="button"
                aria-expanded={showAll}
                onClick={() =>
                  setExpandedForSection(showAll ? null : activeSection.id)
                }
                className="w-full rounded-md py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-50"
              >
                {showAll
                  ? 'Hide other notes'
                  : `Show ${rest.length} more note${rest.length !== 1 ? 's' : ''}`}
              </button>
            </li>
          )}

          {visibleRest.map((seg) => (
            <SourceNoteItem key={seg.id} seg={seg} linked={false} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface SectionEditorProps {
  section: Section;
  index: number;
  total: number;
  allSegments: Segment[];
  isActive: boolean;
  onActivate: () => void;
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
  isActive,
  onActivate,
  onUpdate,
  onMove,
  onRemove,
  onToggleSegment,
}: SectionEditorProps) {
  const [editLinks, setEditLinks] = useState(false);
  const linkedSegs = allSegments.filter((s) =>
    section.sourceSegmentIds.includes(s.id),
  );

  return (
    <li
      onMouseEnter={onActivate}
      onFocusCapture={onActivate}
      className={`rounded-xl border bg-white transition ${
        isActive
          ? 'border-zinc-300 shadow-sm ring-1 ring-zinc-200'
          : 'border-zinc-200'
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
          {index + 1}
        </span>

        <div className="flex gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 disabled:opacity-30"
            title="Move down"
          >
            ↓
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onRemove}
          className="rounded px-1.5 py-0.5 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
          title="Remove section"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3 p-3">
        <input
          type="text"
          value={section.heading}
          onChange={(e) => onUpdate({ heading: e.target.value })}
          placeholder="Section heading"
          className="w-full rounded border border-zinc-200 px-2.5 py-1.5 text-base font-medium text-zinc-800 outline-none focus:border-zinc-400"
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            What this section covers
          </label>
          <textarea
            value={section.intent}
            onChange={(e) => onUpdate({ intent: e.target.value })}
            placeholder="e.g. how to get there, what it costs, what to expect"
            rows={2}
            className="w-full resize-none rounded border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-600 outline-none focus:border-zinc-400"
          />
        </div>

        {/* Linked notes */}
        <div className="rounded-lg bg-zinc-50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-600">
              {linkedSegs.length > 0
                ? `${linkedSegs.length} note${linkedSegs.length !== 1 ? 's' : ''} linked`
                : 'No notes linked'}
            </span>
            <button
              type="button"
              onClick={() => setEditLinks((o) => !o)}
              className="text-xs text-zinc-500 underline-offset-2 transition hover:text-zinc-800 hover:underline"
            >
              {editLinks ? 'Done' : 'Edit links'}
            </button>
          </div>

          {!editLinks &&
            (linkedSegs.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {linkedSegs.map((s) => (
                  <span
                    key={s.id}
                    title={s.text}
                    className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[11px] text-zinc-500"
                  >
                    {s.id}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-zinc-400">
                Without notes, this section may read thin once drafted.
              </p>
            ))}

          {editLinks && (
            <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded border border-zinc-200 bg-white p-2">
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
                        <span className="font-medium text-zinc-500">
                          {seg.id}
                        </span>{' '}
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
