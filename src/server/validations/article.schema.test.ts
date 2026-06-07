import { describe, it, expect } from 'vitest';
import { planOutputSchema } from './article.schema';

const claim = {
  text: 't',
  sourceSegmentIds: [],
  provenance: 'sourced' as const,
};

const planWith = (sectionCount: number) => ({
  isTravelExperience: true,
  reason: null,
  articleType: 'guide',
  purpose: 'p',
  title: 't',
  hookSubtitle: claim,
  intro: claim,
  skeleton: Array.from({ length: sectionCount }, (_, i) => ({
    heading: `H${i}`,
    intent: 'i',
    sourceSegmentIds: [],
  })),
  keyFacts: [],
  bestFor: [],
  notFor: [],
  ethicsSafety: [],
  topTips: [],
  faq: [],
  openQuestions: [],
  unassignedSegments: [],
});

describe('planOutputSchema', () => {
  it('accepts more than 8 sections (the AI decides the count)', () => {
    expect(() => planOutputSchema.parse(planWith(12))).not.toThrow();
  });
});
