'use client';

import type { Claim, Segment } from '@/types';

interface Props {
  claim: Claim | null;
  segments: Segment[];
}

export function SourcePanel({ claim, segments }: Props) {
  if (!claim) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          Source
        </h3>
        <p className="text-sm text-zinc-400">
          Click any highlighted claim to see its source.
        </p>
      </div>
    );
  }

  const sources = segments.filter((s) => claim.sourceSegmentIds.includes(s.id));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        Source
      </h3>

      {sources.length === 0 ? (
        claim.provenance === 'human' ? (
          <p className="text-sm text-zinc-500">
            Added by you — no machine source.
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Not from your notes — verify before publishing.
          </p>
        )
      ) : (
        <ul className="space-y-2">
          {sources.map((seg) => (
            <li
              key={seg.id}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
            >
              <p className="mb-1 text-xs text-zinc-400">
                {seg.id} · {seg.fileName}
              </p>
              <p className="text-sm leading-relaxed text-zinc-700">
                {seg.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
