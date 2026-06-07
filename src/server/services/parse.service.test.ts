import { describe, it, expect } from 'vitest';
import { parseFiles, splitSegments, MAX_POOL_CHARS } from './parse.service';

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
  it('truncates when over the char cap', async () => {
    const r = await parseFiles([
      txt('big.txt', 'x'.repeat(MAX_POOL_CHARS + 100)),
    ]);
    expect(r.truncated).toBe(true);
  });
});
