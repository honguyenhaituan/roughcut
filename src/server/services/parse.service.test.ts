import { describe, it, expect } from 'vitest';
import {
  parseFiles,
  splitSegments,
  atomize,
  MAX_POOL_CHARS,
} from './parse.service';

const txt = (name: string, body: string) => ({
  name,
  buffer: Buffer.from(body),
  mimeType: 'text/plain',
});

describe('splitSegments', () => {
  it('splits on blank lines and tags fileName + sequential ids', () => {
    expect(splitSegments('Para one.\n\nPara two.', 'notes.txt', 0)).toEqual([
      { id: 'S1', text: 'Para one.', fileName: 'notes.txt' },
      { id: 'S2', text: 'Para two.', fileName: 'notes.txt' },
    ]);
  });
  it('continues ids across files via offset', () => {
    expect(splitSegments('Solo.', 'b.txt', 3)[0].id).toBe('S4');
  });
});

describe('atomize', () => {
  it('splits a paragraph into per-sentence atoms, keeping terminal punctuation', () => {
    expect(atomize('Para one. Has two sentences.', 'notes.txt')).toEqual([
      { text: 'Para one.', fileName: 'notes.txt' },
      { text: 'Has two sentences.', fileName: 'notes.txt' },
    ]);
  });
  it('treats each line as a boundary even without punctuation', () => {
    expect(atomize('- Eat at Joe\n- Visit the bay', 'b.txt')).toEqual([
      { text: '- Eat at Joe', fileName: 'b.txt' },
      { text: '- Visit the bay', fileName: 'b.txt' },
    ]);
  });
  it('ignores blank lines and surrounding whitespace', () => {
    expect(atomize('  First.  \n\n\n  Second.  ', 'b.txt')).toEqual([
      { text: 'First.', fileName: 'b.txt' },
      { text: 'Second.', fileName: 'b.txt' },
    ]);
  });
  it('returns nothing for empty or whitespace-only text', () => {
    expect(atomize('   \n\n  ', 'b.txt')).toEqual([]);
  });
});

describe('parseFiles', () => {
  it('rejects an empty file with a reason but keeps others', async () => {
    const r = await parseFiles([
      txt('empty.txt', '   '),
      txt('ok.txt', 'Hello there.'),
    ]);
    expect(r.skipped).toEqual([
      { name: 'empty.txt', reason: 'No text found in file' },
    ]);
    expect(r.segments).toHaveLength(1);
  });
  it('returns raw per-file sources for AI re-segmentation', async () => {
    const r = await parseFiles([txt('ok.txt', 'Hello there. Bye.')]);
    expect(r.sources).toEqual([
      { fileName: 'ok.txt', text: 'Hello there. Bye.' },
    ]);
  });
  it('truncates when over the char cap', async () => {
    const r = await parseFiles([
      txt('big.txt', 'x'.repeat(MAX_POOL_CHARS + 100)),
    ]);
    expect(r.truncated).toBe(true);
  });
});
