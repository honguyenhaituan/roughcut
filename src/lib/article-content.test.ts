import { describe, it, expect } from 'vitest';
import {
  replaceClaim,
  summarize,
  splitClaimInSection,
  removeClaimById,
} from './article-content';
import type { ArticleContent, Claim } from '@/types';

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

describe('splitClaimInSection', () => {
  const newClaim: Claim = {
    id: 'new1',
    text: '',
    sourceSegmentIds: [],
    provenance: 'human',
    verified: false,
  };

  it('inserts the new claim right after the target claim (caret at end)', () => {
    const c = makeContent();
    const result = splitClaimInSection(
      c,
      's1',
      'c1',
      'original body',
      newClaim,
    );
    const body = result.sections[0].body;
    expect(body.map((b) => b.id)).toEqual(['c1', 'new1']);
    // target claim text unchanged when caret is at the end
    expect(body[0].text).toBe('original body');
    expect(body[1]).toEqual(newClaim);
  });

  it('truncates the target to beforeText when split mid-sentence', () => {
    const c = makeContent();
    const after: Claim = { ...newClaim, text: 'body' };
    const result = splitClaimInSection(c, 's1', 'c1', 'original ', after);
    const body = result.sections[0].body;
    expect(body[0].text).toBe('original ');
    expect(body[1].text).toBe('body');
    expect(body[0].id).toBe('c1');
  });

  it('preserves other claims in the section and other sections', () => {
    const c = makeContent({
      sections: [
        {
          id: 's1',
          heading: 'S1',
          intent: '',
          sourceSegmentIds: [],
          body: [
            {
              id: 'a',
              text: 'a',
              sourceSegmentIds: [],
              provenance: 'sourced',
              verified: false,
            },
            {
              id: 'b',
              text: 'b',
              sourceSegmentIds: [],
              provenance: 'sourced',
              verified: false,
            },
          ],
          imageId: null,
        },
        {
          id: 's2',
          heading: 'S2',
          intent: '',
          sourceSegmentIds: [],
          body: [
            {
              id: 'z',
              text: 'z',
              sourceSegmentIds: [],
              provenance: 'sourced',
              verified: false,
            },
          ],
          imageId: null,
        },
      ],
    });
    const result = splitClaimInSection(c, 's1', 'a', 'a', newClaim);
    expect(result.sections[0].body.map((b) => b.id)).toEqual([
      'a',
      'new1',
      'b',
    ]);
    expect(result.sections[1].body.map((b) => b.id)).toEqual(['z']);
  });

  it('returns content unchanged when the claim is not found', () => {
    const c = makeContent();
    const result = splitClaimInSection(c, 's1', 'missing', 'x', newClaim);
    expect(result.sections[0].body.map((b) => b.id)).toEqual(['c1']);
  });

  it('does not mutate the input content', () => {
    const c = makeContent();
    splitClaimInSection(c, 's1', 'c1', 'original body', newClaim);
    expect(c.sections[0].body).toHaveLength(1);
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

describe('removeClaimById', () => {
  it('removes a claim from a section body', () => {
    const c = makeContent();
    const result = removeClaimById(c, 'c1');
    expect(result.sections[0].body).toHaveLength(0);
  });

  it('removes a claim from a free-list field', () => {
    const c = makeContent({
      bestFor: [
        {
          id: 'bf1',
          text: 'families',
          sourceSegmentIds: [],
          provenance: 'sourced',
          verified: true,
        },
      ],
    });
    const result = removeClaimById(c, 'bf1');
    expect(result.bestFor).toHaveLength(0);
  });

  it('leaves required single claims and keyed entries untouched', () => {
    const c = makeContent();
    // intro/hook/keyFacts ids should never be removed by this helper
    expect(removeClaimById(c, 'intro').intro.text).toBe('intro text');
    expect(removeClaimById(c, 'hook').hookSubtitle.text).toBe('hook text');
    expect(removeClaimById(c, 'kf1').keyFacts).toHaveLength(1);
  });

  it('does not mutate the input content', () => {
    const c = makeContent();
    removeClaimById(c, 'c1');
    expect(c.sections[0].body).toHaveLength(1);
  });
});
