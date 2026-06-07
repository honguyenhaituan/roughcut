'use client';

const ASSUMPTIONS = [
  'Output stays grounded to your notes (AI additions flagged amber)',
  'One experience per article',
  'Tone borrowed from Seek Sophie; facts only from your notes',
];

export function AssumptionsPanel() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
        Assumptions this draft runs on
      </h3>
      <ul className="space-y-1.5">
        {ASSUMPTIONS.map((a, i) => (
          <li key={i} className="flex gap-2 text-sm text-zinc-500">
            <span className="mt-0.5 shrink-0 text-zinc-300">—</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-400">
        Best for / Not for are kept for search &amp; matching, even if not
        printed.
      </p>
    </div>
  );
}
