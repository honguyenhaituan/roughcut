import 'server-only';
import { generateObject } from 'ai';
import { model } from '@/server/llm/client';
import {
  resegmentOutputSchema,
  type Segment,
} from '@/server/validations/article.schema';
import { RESEGMENT_SYSTEM, resegmentUser } from '@/server/llm/prompts';
import { atomize, MAX_POOL_CHARS, type Atom } from './parse.service';

// Returns the atom indices where each new segment begins. Injectable so the
// reconstruction/validation/fallback logic can be tested without an LLM call.
export type Grouper = (atoms: Atom[]) => Promise<number[]>;

export function validStarts(starts: number[], n: number): boolean {
  return (
    Array.isArray(starts) &&
    starts.every((s) => Number.isInteger(s) && s >= 0 && s < n)
  );
}

// Reconstructs segments by concatenating the VERBATIM text of grouped atoms —
// the AI only chose boundaries, never the words. `starts` must be sorted and
// include 0 (guaranteed by the caller, which unions in the file boundaries).
export function buildSegments(atoms: Atom[], starts: number[]): Segment[] {
  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : atoms.length;
    const group = atoms.slice(start, end);
    return {
      id: `S${i + 1}`,
      text: group.map((a) => a.text).join(' '),
      fileName: group[0].fileName,
    };
  });
}

function fileBoundaryStarts(atoms: Atom[]): number[] {
  const starts: number[] = [];
  for (let i = 0; i < atoms.length; i++) {
    if (i === 0 || atoms[i].fileName !== atoms[i - 1].fileName) starts.push(i);
  }
  return starts;
}

function capAtoms(atoms: Atom[]): { atoms: Atom[]; truncated: boolean } {
  let total = 0;
  const out: Atom[] = [];
  for (const a of atoms) {
    if (total + a.text.length > MAX_POOL_CHARS) {
      return { atoms: out, truncated: true };
    }
    total += a.text.length;
    out.push(a);
  }
  return { atoms: out, truncated: false };
}

const llmGrouper: Grouper = async (atoms) => {
  const { object } = await generateObject({
    model: model(),
    schema: resegmentOutputSchema,
    system: RESEGMENT_SYSTEM,
    prompt: resegmentUser(atoms),
    maxRetries: 1,
  });
  return object.segmentStarts;
};

export async function segmentSources(
  sources: { fileName: string; text: string }[],
  fallback: { segments: Segment[]; truncated: boolean },
  grouper: Grouper = llmGrouper,
): Promise<{ segments: Segment[]; truncated: boolean }> {
  const { atoms, truncated } = capAtoms(
    sources.flatMap((s) => atomize(s.text, s.fileName)),
  );
  if (atoms.length === 0) return fallback;
  try {
    const llmStarts = await grouper(atoms);
    if (!validStarts(llmStarts, atoms.length)) return fallback;
    const starts = [
      ...new Set([...llmStarts, ...fileBoundaryStarts(atoms)]),
    ].sort((a, b) => a - b);
    return { segments: buildSegments(atoms, starts), truncated };
  } catch {
    return fallback;
  }
}
