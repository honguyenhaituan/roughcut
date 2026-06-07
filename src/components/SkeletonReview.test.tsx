import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { SkeletonReview } from './SkeletonReview';
import type { ArticleContent } from '@/types';

function emptyClaim(id: string) {
  return {
    id,
    text: '',
    sourceSegmentIds: [],
    provenance: 'sourced' as const,
    verified: false,
  };
}

function content(): ArticleContent {
  return {
    hookSubtitle: emptyClaim('hook'),
    intro: emptyClaim('intro'),
    sections: [
      {
        id: 'drafted',
        heading: 'Drafted',
        intent: '',
        sourceSegmentIds: [],
        body: [emptyClaim('b1')], // already has a body
        imageId: null,
      },
      {
        id: 'fresh',
        heading: 'Fresh',
        intent: '',
        sourceSegmentIds: [],
        body: [], // newly added, empty
        imageId: null,
      },
    ],
    keyFacts: [],
    bestFor: [],
    notFor: [],
    ethicsSafety: [],
    topTips: [],
    faq: [],
    openQuestions: [],
    unassignedSegments: [],
    isTravelExperience: true,
    heroImageId: null,
  };
}

const article = {
  id: 'a1',
  title: 'Trip',
  articleType: 'pocket_guide',
  status: 'planned' as const,
  content: content(),
  sourceSegments: [],
  media: [],
};

describe('SkeletonReview drafting', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...article, status: 'ready' }),
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('drafts only sections whose body is empty (preserves drafted ones)', async () => {
    let draftFn: (() => void) | null = null;
    render(
      <SkeletonReview
        article={article}
        onDrafted={vi.fn()}
        registerDraft={(fn) => {
          draftFn = fn;
        }}
        onStateChange={() => {}}
      />,
    );
    await act(async () => {
      draftFn!();
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/articles/a1/draft',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const draftCall = (
      global.fetch as ReturnType<typeof vi.fn>
    ).mock.calls.find(([url]) => url === '/api/articles/a1/draft');
    const body = JSON.parse(draftCall![1].body);
    expect(body.sectionIds).toEqual(['fresh']);
  });
});
