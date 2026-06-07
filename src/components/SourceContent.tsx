import type { Claim, Segment } from '@/types';

interface Props {
  claim: Claim;
  segments: Segment[];
}

/** Renders the source notes behind a claim — shared by the popover. */
export function SourceContent({ claim, segments }: Props) {
  const sources = segments.filter((s) => claim.sourceSegmentIds.includes(s.id));

  if (sources.length === 0) {
    return claim.provenance === 'human' ? (
      <p className="text-sm text-zinc-500">Added by you — no machine source.</p>
    ) : (
      <p className="text-sm text-amber-700">
        Not from your notes — verify before publishing.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {sources.map((seg) => (
        <li
          key={seg.id}
          className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
        >
          <p className="mb-1 text-xs text-zinc-400">
            {seg.id} · {seg.fileName}
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">{seg.text}</p>
        </li>
      ))}
    </ul>
  );
}
