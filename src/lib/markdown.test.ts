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

  it('exports hero and section images as markdown image links', () => {
    const md = articleToMarkdown({
      title: 'Komodo',
      content: {
        hookSubtitle: claim(''),
        intro: claim(''),
        sections: [
          {
            id: 's',
            heading: 'Getting there',
            intent: '',
            sourceSegmentIds: [],
            imageId: 'img-2',
            body: [claim('Fly to Labuan Bajo.')],
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
        heroImageId: 'img-1',
      },
      media: [
        {
          id: 'img-1',
          src: 'https://blob.example/hero.jpg',
          sourceFileName: 'hero.jpg',
          origin: 'uploaded',
          mimeType: 'image/jpeg',
        },
        {
          id: 'img-2',
          src: 'https://blob.example/section.jpg',
          sourceFileName: 'section.jpg',
          origin: 'extracted',
          mimeType: 'image/jpeg',
        },
      ],
    });
    expect(md).toContain('![Komodo](https://blob.example/hero.jpg)');
    expect(md).toContain('![Getting there](https://blob.example/section.jpg)');
  });
});
