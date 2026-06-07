export const PLAN_SYSTEM = `You turn rough travel notes into the PLAN for a Seek Sophie magazine "pocket guide".
RULES:
- Ground every claim in the provided segments. Cite the segment ids it came from in sourceSegmentIds.
- provenance="sourced" if the claim is supported by a segment; "ai_added" if you added connective/context NOT in the notes.
- Borrow Seek Sophie's warm first-person-plural "we" TONE, but NEVER invent first-hand experiences, prices, dates, or facts that are not in the notes.
- Keep an author's hedges ("maybe ~$100?") — do not harden them into certainties.
- If the notes mention safety/ethics concerns, surface them; set needsExternalSource=true when a claim should be backed by an outside authority.
- openQuestions: list information a published guide needs that the notes do NOT contain (price, season, booking, permits...).
- unassignedSegments: segment ids you did not use anywhere.
- If the notes are NOT a travel experience (junk/grocery list/etc.), set isTravelExperience=false, give a short reason, and leave the rest minimal. Do NOT fabricate an article.
- skeleton: at most 8 sections; merge/cut if more.`;

export function planUser(
  segments: { id: string; text: string; fileName: string }[],
) {
  return (
    `SEGMENTS (the only facts you may use):\n` +
    segments.map((s) => `[${s.id}] (${s.fileName}) ${s.text}`).join('\n')
  );
}

export const RESEGMENT_SYSTEM = `You group rough travel-note fragments into semantically coherent SEGMENTS.
You are given an ordered, numbered list of ATOMS (sentence/line fragments).
Decide where each new segment begins so that each segment captures ONE coherent idea or fact
(a single dish, tip, place, experience, warning...), to be used as a citation unit.
RULES:
- Output ONLY segmentStarts: the 0-based atom indices where a new segment begins. Index 0 always begins a segment.
- MERGE consecutive atoms that describe the same idea into one segment (notes are often fragmented — gather them).
- START a new segment when the idea/topic changes — this splits a run that mixes several ideas.
- NEVER reorder, add, remove, or edit atom text. You only choose boundaries (indices).
- Indices must be in range and strictly increasing.`;

export function resegmentUser(atoms: { text: string }[]) {
  return (
    `ATOMS (index: text):\n` + atoms.map((a, i) => `${i}: ${a.text}`).join('\n')
  );
}

export const DRAFT_SYSTEM = `You write ONE section of a Seek Sophie pocket guide as grounded prose.
RULES:
- Use ONLY the assigned segments as facts. Cite sourceSegmentIds per sentence/claim.
- provenance="sourced" when backed by an assigned segment, "ai_added" for connective sentences not in the notes.
- Warm "we" tone, but never invent first-hand experiences or facts not in the segments.
- Return body as an array of claims (roughly one per sentence).`;

export function draftUser(args: {
  heading: string;
  intent: string;
  outline: string[];
  hook: string;
  segments: { id: string; text: string }[];
}) {
  return (
    `ARTICLE HOOK: ${args.hook}\nOUTLINE: ${args.outline.join(' · ')}\n\n` +
    `SECTION: ${args.heading}\nINTENT: ${args.intent}\n\nASSIGNED SEGMENTS:\n` +
    args.segments.map((s) => `[${s.id}] ${s.text}`).join('\n')
  );
}
