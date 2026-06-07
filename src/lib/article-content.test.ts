import { describe, it, expect } from 'vitest';
import { replaceClaim, summarize } from './article-content';
import type { ArticleContent } from '@/types';

function makeContent(overrides?: Partial<ArticleContent>): ArticleContent {
  return {
    hookSubtitle: {
      id: 'hook',
      text: 'hook text',
      sourceSegmentIds: [],
      provenance: 'sourced',
      verified: true,
    },
    intro: {
      id: 'intro',
      text: 'intro text',
      sourceSegmentIds: [],
      provenance: 'sourced',
      verified: true,
    },
    sections: [
      {
        id: 's1',
        heading: 'Section 1',
        intent: 'Cover the basics',
        sourceSegmentIds: ['seg1'],
        body: [
          {
            id: 'c1',
            text: 'original body',
            sourceSegmentIds: ['seg1'],
            provenance: 'sourced',
            verified: false,
          },
        ],
        imageId: null,
      },
    ],
    keyFacts: [
      {
        id: 'kf1',
        text: 'fact value',
        label: 'Fact Label',
        value: 'fact value',
        sourceSegmentIds: [],
        provenance: 'sourced',
        verified: true,
      },
    ],
    bestFor: [],
    notFor: [],
    ethicsSafety: [],
    topTips: [],
    faq: [],
    openQuestions: ['Why?', 'How?'],
    unassignedSegments: [],
    isTravelExperience: true,
    heroImageId: null,
    ...overrides,
  };
}

describe('replaceClaim', () => {
  it('updates a section-body claim text and provenance', () => {
    const c = makeContent();
    const result = replaceClaim(c, {
      id: 'c1',
      text: 'updated body',
      sourceSegmentIds: ['seg1'],
      provenance: 'human',
      verified: false,
    });
    expect(result.sections[0].body[0].text).toBe('updated body');
    expect(result.sections[0].body[0].provenance).toBe('human');
  });

  it('preserves extra fields (label/value) on a keyFact when updating', () => {
    const c = makeContent();
    const result = replaceClaim(c, {
      id: 'kf1',
      text: 'new value',
      sourceSegmentIds: [],
      provenance: 'human',
      verified: true,
    });
    const kf = result.keyFacts[0];
    expect(kf.text).toBe('new value');
    expect(kf.provenance).toBe('human');
    // label/value must survive — they are extra fields on the original
    expect(kf.label).toBe('Fact Label');
    expect(kf.value).toBe('fact value');
  });

  it('does not mutate other claims when replacing by id', () => {
    const c = makeContent();
    const result = replaceClaim(c, {
      id: 'hook',
      text: 'new hook',
      sourceSegmentIds: [],
      provenance: 'human',
      verified: false,
    });
    expect(result.hookSubtitle.text).toBe('new hook');
    // intro untouched
    expect(result.intro.text).toBe('intro text');
  });
});

describe('summarize', () => {
  it('counts ai_added unverified claims', () => {
    const c = makeContent({
      bestFor: [
        {
          id: 'bf1',
          text: 'good for families',
          sourceSegmentIds: [],
          provenance: 'ai_added',
          verified: false,
        },
      ],
    });
    const s = summarize(c);
    expect(s.unverified).toBe(1);
  });

  it('counts grounded (sourced) claims', () => {
    const c = makeContent();
    const s = summarize(c);
    // hook + intro + c1 + kf1 = 4 sourced
    expect(s.grounded).toBe(4);
  });

  it('counts open questions as gaps', () => {
    const c = makeContent();
    const s = summarize(c);
    expect(s.gaps).toBe(2);
  });

  it('does not count ai_added verified claims as unverified', () => {
    const c = makeContent({
      topTips: [
        {
          id: 'tt1',
          text: 'tip',
          sourceSegmentIds: [],
          provenance: 'ai_added',
          verified: true,
        },
      ],
    });
    const s = summarize(c);
    expect(s.unverified).toBe(0);
  });
});
