import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceNotesRail } from './SkeletonReview';
import type { Segment } from '@/types';

const segs: Segment[] = [
  { id: 'S1', text: 'note one', fileName: 'a.txt' },
  { id: 'S2', text: 'note two', fileName: 'a.txt' },
  { id: 'S3', text: 'note three', fileName: 'a.txt' },
  { id: 'S4', text: 'note four', fileName: 'a.txt' },
];
const section = (ids: string[], id = 'sec1') => ({
  id,
  heading: 'H',
  intent: '',
  sourceSegmentIds: ids,
  body: [],
  imageId: null,
});

describe('SourceNotesRail', () => {
  it('no active section → shows all notes, no toggle', () => {
    render(
      <SourceNotesRail
        segments={segs}
        activeSection={null}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText('note one')).toBeInTheDocument();
    expect(screen.getByText('note four')).toBeInTheDocument();
    expect(screen.queryByText(/more note/)).not.toBeInTheDocument();
  });

  it('active section → linked note first, rest collapsed behind a toggle', () => {
    render(
      <SourceNotesRail
        segments={segs}
        activeSection={section(['S3'])}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText('note three')).toBeInTheDocument();
    expect(screen.queryByText('note one')).not.toBeInTheDocument();
    expect(screen.getByText('Show 3 more notes')).toBeInTheDocument();
  });

  it('expands the rest on toggle', async () => {
    const user = userEvent.setup();
    render(
      <SourceNotesRail
        segments={segs}
        activeSection={section(['S3'])}
        onClear={() => {}}
      />,
    );
    await user.click(screen.getByText('Show 3 more notes'));
    expect(screen.getByText('note one')).toBeInTheDocument();
    expect(screen.getByText('Hide other notes')).toBeInTheDocument();
  });

  it('orders linked notes by original segment order', () => {
    render(
      <SourceNotesRail
        segments={segs}
        activeSection={section(['S4', 'S2'])}
        onClear={() => {}}
      />,
    );
    const two = screen.getByText('note two');
    const four = screen.getByText('note four');
    expect(
      two.compareDocumentPosition(four) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('re-collapses when the active section changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SourceNotesRail
        segments={segs}
        activeSection={section(['S3'])}
        onClear={() => {}}
      />,
    );
    await user.click(screen.getByText('Show 3 more notes'));
    expect(screen.getByText('note one')).toBeInTheDocument();
    rerender(
      <SourceNotesRail
        segments={segs}
        activeSection={section(['S1'], 'sec2')}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText('note one')).toBeInTheDocument();
    expect(screen.queryByText('note three')).not.toBeInTheDocument();
    expect(screen.getByText('Show 3 more notes')).toBeInTheDocument();
  });
});
