import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArticleReader } from './ArticleReader';
import type { ArticleContent } from '@/types';

const claim = (text: string) => ({
  id: crypto.randomUUID(),
  text,
  sourceSegmentIds: [],
  provenance: 'sourced' as const,
  verified: false,
});

const content: ArticleContent = {
  isTravelExperience: true,
  hookSubtitle: claim('A catchy hook'),
  intro: claim('An intro paragraph'),
  sections: [
    {
      id: 's1',
      heading: 'Getting there',
      intent: '',
      sourceSegmentIds: [],
      body: [claim('Take the night bus.')],
      imageId: null,
    },
  ],
  keyFacts: [],
  bestFor: [claim('Solo travelers')],
  notFor: [],
  ethicsSafety: [],
  topTips: [],
  faq: [],
  openQuestions: ['internal gap note'],
  unassignedSegments: [],
  heroImageId: null,
};

describe('ArticleReader', () => {
  it('renders the title, hook, section heading, body and best-for', () => {
    render(<ArticleReader title="My Trip" content={content} media={[]} />);
    expect(screen.getByText('My Trip')).toBeInTheDocument();
    expect(screen.getByText('A catchy hook')).toBeInTheDocument();
    expect(screen.getByText('Getting there')).toBeInTheDocument();
    expect(screen.getByText('Take the night bus.')).toBeInTheDocument();
    expect(screen.getByText('Solo travelers')).toBeInTheDocument();
  });

  it('does not leak editorial internals (open questions)', () => {
    render(<ArticleReader title="My Trip" content={content} media={[]} />);
    expect(screen.queryByText('internal gap note')).not.toBeInTheDocument();
  });
});
