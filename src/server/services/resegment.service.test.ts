import { describe, it, expect } from 'vitest';
import {
  validStarts,
  buildSegments,
  segmentSources,
} from './resegment.service';
import type { Atom } from './parse.service';

const atoms = (texts: string[], fileName = 'n.txt'): Atom[] =>
  texts.map((text) => ({ text, fileName }));

describe('validStarts', () => {
  it('accepts in-range integer indices', () => {
    expect(validStarts([0, 2, 3], 5)).toBe(true);
  });
  it('accepts empty (one big segment)', () => {
    expect(validStarts([], 5)).toBe(true);
  });
  it('rejects an out-of-range index', () => {
    expect(validStarts([0, 5], 5)).toBe(false);
  });
  it('rejects non-integer indices', () => {
    expect(validStarts([0, 1.5], 5)).toBe(false);
  });
});

describe('buildSegments', () => {
  it('groups atoms by start boundaries, joining verbatim with sequential ids', () => {
    expect(buildSegments(atoms(['A.', 'B.', 'C.', 'D.']), [0, 2])).toEqual([
      { id: 'S1', text: 'A. B.', fileName: 'n.txt' },
      { id: 'S2', text: 'C. D.', fileName: 'n.txt' },
    ]);
  });
});

describe('segmentSources', () => {
  const sources = [{ fileName: 'n.txt', text: 'A. B. C.' }];
  const fallback = {
    segments: [{ id: 'S1', text: 'A. B. C.', fileName: 'n.txt' }],
    truncated: false,
  };

  it('uses AI boundaries to merge/split, keeping every atom in order', async () => {
    const grouper = async () => [0, 2];
    const { segments } = await segmentSources(sources, fallback, grouper);
    expect(segments).toEqual([
      { id: 'S1', text: 'A. B.', fileName: 'n.txt' },
      { id: 'S2', text: 'C.', fileName: 'n.txt' },
    ]);
  });

  it('never merges atoms from different files even if the AI asks', async () => {
    const multi = [
      { fileName: 'a.txt', text: 'A.' },
      { fileName: 'b.txt', text: 'B.' },
    ];
    const grouper = async () => [0]; // AI wants one segment spanning both files
    const { segments } = await segmentSources(
      multi,
      { segments: [], truncated: false },
      grouper,
    );
    expect(segments).toEqual([
      { id: 'S1', text: 'A.', fileName: 'a.txt' },
      { id: 'S2', text: 'B.', fileName: 'b.txt' },
    ]);
  });

  it('falls back to syntactic segments when the AI throws', async () => {
    const grouper = async () => {
      throw new Error('llm down');
    };
    const { segments } = await segmentSources(sources, fallback, grouper);
    expect(segments).toBe(fallback.segments);
  });

  it('falls back when the AI returns out-of-range indices', async () => {
    const grouper = async () => [0, 99];
    const { segments } = await segmentSources(sources, fallback, grouper);
    expect(segments).toBe(fallback.segments);
  });
});
