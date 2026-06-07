import { describe, it, expect } from 'vitest';
import { articleToMarkdown } from './markdown';

const claim = (text: string) => ({
  id: 'c',
  text,
  sourceSegmentIds: [],
  provenance: 'sourced' as const,
  verified: true,
});

describe('articleToMarkdown', () => {
  it('renders title, hook, sections and key facts', () => {
    const md = articleToMarkdown({
      title: 'Komodo',
      content: {
        hookSubtitle: claim('Island hopping done right'),
        intro: claim('Intro here.'),
        sections: [
          {
            id: 's',
            heading: 'Getting there',
            intent: '',
            sourceSegmentIds: [],
            imageId: null,
            body: [claim('Fly to Labuan Bajo.')],
          },
        ],
        keyFacts: [
          { ...claim('300k IDR'), label: 'Park fee', value: '300k IDR' },
        ],
        bestFor: [],
        notFor: [],
        ethicsSafety: [],
        topTips: [],
        faq: [],
        openQuestions: [],
        unassignedSegments: [],
        isTravelExperience: true,
        heroImageId: null,
      },
    });
    expect(md).toContain('# Komodo');
    expect(md).toContain('## Getting there');
    expect(md).toContain('Fly to Labuan Bajo.');
    expect(md).toContain('Park fee');
  });
});
