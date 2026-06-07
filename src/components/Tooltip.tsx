'use client';

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'green' | 'amber' | 'blue' | 'zinc';

// Full literal classes per tone — Tailwind v4 purges interpolated ones.
const TONE: Record<Tone, string> = {
  neutral: 'bg-zinc-900 text-zinc-100 ring-zinc-700',
  green: 'bg-green-50 text-green-800 ring-green-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-blue-50 text-blue-800 ring-blue-200',
  zinc: 'bg-zinc-100 text-zinc-700 ring-zinc-300',
};

interface Props {
  label: ReactNode;
  children: ReactNode;
  /** Colors the bubble to match the content it describes. */
  tone?: Tone;
  /** Extra classes for the wrapper (e.g. layout/spacing of the trigger). */
  className?: string;
}

/**
 * Lightweight CSS hover/focus tooltip — a styled bubble below the trigger.
 * No JS positioning; left-aligned so it extends rightward and won't clip
 * at a left edge.
 */
export function Tooltip({
  label,
  children,
  tone = 'neutral',
  className = '',
}: Props) {
  return (
    <span className={`group/tt relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full left-0 z-50 mt-2 w-max max-w-[15rem] translate-y-1 rounded-md px-2 py-1 text-xs leading-snug font-medium opacity-0 shadow-lg ring-1 transition duration-150 group-focus-within/tt:translate-y-0 group-focus-within/tt:opacity-100 group-hover/tt:translate-y-0 group-hover/tt:opacity-100 ${TONE[tone]}`}
      >
        {label}
      </span>
    </span>
  );
}
