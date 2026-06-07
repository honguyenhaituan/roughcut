import 'server-only';
import mammoth from 'mammoth';
import type { Segment } from '@/server/validations/article.schema';

export const MAX_POOL_CHARS = 40_000;
const DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function splitSegments(
  text: string,
  fileName: string,
  offset: number,
): Segment[] {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t, i) => ({ id: `S${offset + i + 1}`, text: t, fileName }));
}

export type Atom = { text: string; fileName: string };

// Finest verbatim unit for AI re-segmentation: each line is a hard boundary,
// and within a line we split on sentence terminators. The AI later groups these
// atoms back into semantically-coherent segments — going below the paragraph
// level is what lets it SPLIT a long mixed-idea paragraph, not just merge.
export function atomize(text: string, fileName: string): Atom[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?…]+[.!?…]*/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean)
    .map((t) => ({ text: t, fileName }));
}

type InputFile = { name: string; buffer: Buffer; mimeType: string };
type ExtractedImage = {
  buffer: Buffer;
  mimeType: string;
  sourceFileName: string;
};

async function readFile(
  file: InputFile,
): Promise<{ text: string; images: ExtractedImage[] }> {
  const ext = file.name.toLowerCase();
  if (ext.endsWith('.docx') || file.mimeType === DOCX) {
    const images: ExtractedImage[] = [];
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    await mammoth.convertToHtml(
      { buffer: file.buffer },
      {
        convertImage: mammoth.images.imgElement(async (img) => {
          const buf = await img.readAsBuffer();
          images.push({
            buffer: buf,
            mimeType: img.contentType,
            sourceFileName: file.name,
          });
          // src is required by mammoth's ImageAttributes; unused since we store the buffer directly.
          return { src: '' };
        }),
      },
    );
    return { text: value, images };
  }
  if (ext.endsWith('.txt') || ext.endsWith('.md')) {
    return { text: file.buffer.toString('utf8'), images: [] };
  }
  throw new Error('UNSUPPORTED');
}

export async function parseFiles(files: InputFile[]) {
  const segments: Segment[] = [];
  const sources: { fileName: string; text: string }[] = [];
  const images: ExtractedImage[] = [];
  const skipped: { name: string; reason: string }[] = [];
  for (const file of files) {
    let parsed: { text: string; images: ExtractedImage[] };
    try {
      parsed = await readFile(file);
    } catch (e) {
      skipped.push({
        name: file.name,
        reason:
          (e as Error).message === 'UNSUPPORTED'
            ? 'Unsupported file type (use .docx, .txt, .md)'
            : 'Could not read file (corrupt or password-protected)',
      });
      continue;
    }
    if (!parsed.text.trim()) {
      skipped.push({ name: file.name, reason: 'No text found in file' });
      continue;
    }
    segments.push(...splitSegments(parsed.text, file.name, segments.length));
    sources.push({ fileName: file.name, text: parsed.text });
    images.push(...parsed.images);
  }
  let total = 0,
    truncated = false;
  const capped: Segment[] = [];
  for (const s of segments) {
    if (total + s.text.length > MAX_POOL_CHARS) {
      truncated = true;
      break;
    }
    total += s.text.length;
    capped.push(s);
  }
  return { segments: capped, sources, images, truncated, skipped };
}
