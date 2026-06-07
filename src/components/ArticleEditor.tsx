'use client';

import { useCallback, useState } from 'react';
import type { Claim, ArticleContent, Segment, Media } from '@/types';
import { splitClaimInSection, removeClaimById } from '@/lib/article-content';
import { ClaimText } from './ClaimText';
import { SourceContent } from './SourceContent';
import { OpenQuestionsPanel } from './OpenQuestionsPanel';
import { AssumptionsPanel } from './AssumptionsPanel';
import { ImageSlot } from './ImageSlot';
import { MediaTray } from './MediaTray';

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
  title: string;
  content: ArticleContent;
  media: Media[];
  selectedClaim: Claim | null;
  onTitleChange: (t: string) => void;
  onClaimChange: (c: Claim) => void;
  onSelect: (c: Claim | null) => void;
  patchContent: (next: ArticleContent) => void;
  onMediaUploaded: (m: Media) => void;
  onServerWriteStart?: () => void;
  onServerWriteEnd?: () => void;
}

interface SectionDraftState {
  loading: boolean;
  error: boolean;
}

export function ArticleEditor({
  article,
  title,
  content,
  media,
  selectedClaim,
  onTitleChange,
  onClaimChange,
  onSelect,
  patchContent,
  onMediaUploaded,
  onServerWriteStart,
  onServerWriteEnd,
}: Props) {
  const [sectionStates, setSectionStates] = useState<
    Record<string, SectionDraftState>
  >({});
  // Id of a freshly-split claim that should grab focus on its next render.
  const [focusClaimId, setFocusClaimId] = useState<string | null>(null);
  const clearFocus = useCallback(() => setFocusClaimId(null), []);

  const claim = (c: Claim, onDelete?: () => void) => (
    <ClaimText
      claim={c}
      isSelected={selectedClaim?.id === c.id}
      onSelect={onSelect}
      onChange={onClaimChange}
      onDelete={onDelete}
    />
  );

  const deleteClaim = (c: Claim) => () =>
    patchContent(removeClaimById(content, c.id));

  const splitBody = (
    sectionId: string,
    claimId: string,
    before: string,
    after: string,
  ) => {
    const newClaim: Claim = {
      id: crypto.randomUUID(),
      text: after,
      sourceSegmentIds: [],
      provenance: 'human',
      verified: false,
    };
    patchContent(
      splitClaimInSection(content, sectionId, claimId, before, newClaim),
    );
    setFocusClaimId(newClaim.id);
  };

  const bodyClaim = (sectionId: string, c: Claim) => (
    <ClaimText
      claim={c}
      isSelected={selectedClaim?.id === c.id}
      onSelect={onSelect}
      onChange={onClaimChange}
      onSplit={(before, after) => splitBody(sectionId, c.id, before, after)}
      onDelete={deleteClaim(c)}
      autoFocus={focusClaimId === c.id}
      onFocused={clearFocus}
    />
  );

  const regenerateSection = async (sectionId: string) => {
    setSectionStates((prev) => ({
      ...prev,
      [sectionId]: { loading: true, error: false },
    }));
    // Suspend autosave so a stale PATCH can't clobber the regenerated body.
    onServerWriteStart?.();
    try {
      const res = await fetch(`/api/articles/${article.id}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIds: [sectionId] }),
      });
      if (!res.ok) throw new Error('Draft failed');
      const updated = (await res.json()) as ArticleRow;
      const updatedSection = (updated.content as ArticleContent).sections.find(
        (s) => s.id === sectionId,
      );
      if (updatedSection) {
        patchContent({
          ...content,
          sections: content.sections.map((s) =>
            s.id === sectionId
              ? { ...s, body: updatedSection.body, draftError: false }
              : s,
          ),
        });
      }
      setSectionStates((prev) => ({
        ...prev,
        [sectionId]: { loading: false, error: false },
      }));
    } catch {
      setSectionStates((prev) => ({
        ...prev,
        [sectionId]: { loading: false, error: true },
      }));
    } finally {
      onServerWriteEnd?.();
    }
  };

  const updateSectionHeading = (sectionId: string, heading: string) => {
    patchContent({
      ...content,
      sections: content.sections.map((s) =>
        s.id === sectionId ? { ...s, heading } : s,
      ),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 lg:flex-row lg:items-start">
      {/* Main column */}
      <main className="mx-auto w-full max-w-3xl flex-1 py-10">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mb-4 w-full border-0 bg-transparent text-2xl font-semibold text-zinc-900 outline-none placeholder:text-zinc-300 focus:ring-0"
          placeholder="Article title"
        />

        {/* Hero image */}
        <ImageSlot
          label="Hero image"
          imageId={content.heroImageId}
          media={media}
          articleId={article.id}
          onChange={(id) => patchContent({ ...content, heroImageId: id })}
          onUploaded={onMediaUploaded}
        />

        {/* Hook */}
        <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Hook
        </p>
        <div className="mb-6 text-base leading-relaxed">
          {claim(content.hookSubtitle)}
        </div>

        {/* Intro */}
        <p className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Intro
        </p>
        <div className="mb-8 text-base leading-relaxed">
          {claim(content.intro)}
        </div>

        {/* Sections */}
        {content.sections.map((section) => {
          const st = sectionStates[section.id];
          return (
            <section key={section.id} className="mb-10">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="text"
                  value={section.heading}
                  onChange={(e) =>
                    updateSectionHeading(section.id, e.target.value)
                  }
                  className="flex-1 border-0 bg-transparent text-lg font-semibold text-zinc-800 outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => regenerateSection(section.id)}
                  disabled={st?.loading}
                  className="shrink-0 rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  {st?.loading ? 'Writing…' : 'Regenerate'}
                </button>
              </div>
              {section.draftError && !st?.loading && (
                <p className="mb-2 text-xs text-red-600">
                  Couldn&apos;t draft this section —{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => regenerateSection(section.id)}
                  >
                    retry
                  </button>
                </p>
              )}
              {st?.error && (
                <p className="mb-2 text-xs text-red-600">
                  Error regenerating —{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => regenerateSection(section.id)}
                  >
                    retry
                  </button>
                </p>
              )}
              <ImageSlot
                label="Section image"
                imageId={section.imageId}
                media={media}
                articleId={article.id}
                onChange={(id) =>
                  patchContent({
                    ...content,
                    sections: content.sections.map((s) =>
                      s.id === section.id ? { ...s, imageId: id } : s,
                    ),
                  })
                }
                onUploaded={onMediaUploaded}
              />
              <div className="mb-4 space-y-1 text-base leading-relaxed">
                {section.body.map((c) => (
                  <div key={c.id}>{bodyClaim(section.id, c)}</div>
                ))}
                {section.body.length === 0 && st?.loading && (
                  <p className="px-1.5 text-zinc-400 italic">Drafting…</p>
                )}
              </div>
            </section>
          );
        })}

        {/* Key facts */}
        {content.keyFacts.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              Key facts
            </h2>
            <dl className="space-y-2">
              {content.keyFacts.map((kf) => (
                <div key={kf.id} className="flex gap-2 text-sm">
                  <dt className="mt-1 shrink-0 font-medium text-zinc-600">
                    {kf.label}:
                  </dt>
                  <dd className="min-w-0 flex-1">{claim(kf)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Best for / Not for */}
        {(content.bestFor.length > 0 || content.notFor.length > 0) && (
          <section className="mb-8 grid grid-cols-2 gap-6">
            {content.bestFor.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                  Best for
                </h2>
                <ul className="space-y-1.5">
                  {content.bestFor.map((c) => (
                    <li key={c.id} className="text-sm">
                      {claim(c, deleteClaim(c))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {content.notFor.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                  Not for
                </h2>
                <ul className="space-y-1.5">
                  {content.notFor.map((c) => (
                    <li key={c.id} className="text-sm">
                      {claim(c, deleteClaim(c))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="col-span-2 text-xs text-zinc-400">
              Best for / Not for are kept for search &amp; matching, even if not
              printed in the article.
            </p>
          </section>
        )}

        {/* Ethics & safety */}
        {content.ethicsSafety.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              Ethics &amp; safety
            </h2>
            <ul className="space-y-2">
              {content.ethicsSafety.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm">
                  {claim(c, deleteClaim(c))}
                  {c.needsExternalSource && (
                    <span className="mt-1.5 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      needs external source
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Top tips */}
        {content.topTips.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              Top tips
            </h2>
            <ul className="space-y-2">
              {content.topTips.map((c) => (
                <li key={c.id} className="text-sm">
                  {claim(c, deleteClaim(c))}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        {content.faq.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              FAQ
            </h2>
            <dl className="space-y-4">
              {content.faq.map((f) => (
                <div key={f.id}>
                  <dt className="mb-1 font-medium text-zinc-700">{f.q}</dt>
                  <dd className="text-sm">{claim(f.a)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>

      {/* Right rail */}
      <aside className="w-full shrink-0 space-y-4 py-10 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-80 lg:overflow-y-auto">
        {selectedClaim && (
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm lg:sticky lg:top-0 lg:z-10">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Source
              </h3>
              <button
                type="button"
                onClick={() => onSelect(null)}
                aria-label="Close source"
                className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <SourceContent
              claim={selectedClaim}
              segments={article.sourceSegments}
            />
          </div>
        )}
        <OpenQuestionsPanel questions={content.openQuestions} />
        <AssumptionsPanel />
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Images
          </p>
          <MediaTray
            articleId={article.id}
            media={media}
            onUploaded={onMediaUploaded}
          />
        </div>
      </aside>
    </div>
  );
}
