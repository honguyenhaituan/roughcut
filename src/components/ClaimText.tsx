'use client';

import { useEffect, useRef } from 'react';
import type { Claim } from '@/types';
import { Tooltip } from './Tooltip';

// Provenance color, encoded on the status marker. Full literal classes —
// Tailwind v4 purges interpolated ones.
const MARKER_UNVERIFIED: Record<Claim['provenance'], string> = {
  sourced: 'border-green-500 bg-white text-green-600',
  human: 'border-blue-500 bg-white text-blue-600',
  ai_added: 'border-amber-500 border-dashed bg-white text-amber-600',
};
const MARKER_VERIFIED: Record<Claim['provenance'], string> = {
  sourced: 'border-green-500 bg-green-500 text-white',
  human: 'border-blue-500 bg-blue-500 text-white',
  ai_added: 'border-amber-500 bg-amber-500 text-white',
};

// Subtle row highlight when selected — the claim's source shows in the rail.
const SELECTED_ROW: Record<Claim['provenance'], string> = {
  sourced: 'bg-green-50 ring-1 ring-green-200',
  human: 'bg-blue-50 ring-1 ring-blue-200',
  ai_added: 'bg-amber-50 ring-1 ring-amber-200',
};

// What each marker color means — surfaced as a hover tooltip.
const PROVENANCE_LABEL: Record<Claim['provenance'], string> = {
  sourced: 'Green — grounded in your source notes',
  human: 'Blue — written by you',
  ai_added: 'Amber — AI-added, not from your notes',
};

interface Props {
  claim: Claim;
  isSelected: boolean;
  onSelect: (c: Claim | null) => void;
  onChange: (c: Claim) => void;
  /** When set, pressing Enter splits this claim into a new one after the caret. */
  onSplit?: (beforeText: string, afterText: string) => void;
  /** When set, a delete control appears on hover. */
  onDelete?: () => void;
  /** Focus the editable on mount (used for a freshly-split claim). */
  autoFocus?: boolean;
  /** Called once the autoFocus has been applied so the parent can clear it. */
  onFocused?: () => void;
}

export function ClaimText({
  claim,
  isSelected,
  onSelect,
  onChange,
  onSplit,
  onDelete,
  autoFocus,
  onFocused,
}: Props) {
  const editableRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const el = editableRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // caret to end
      sel.removeAllRanges();
      sel.addRange(range);
    }
    onFocused?.();
  }, [autoFocus, onFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key !== 'Enter') return;
    // Never insert a literal newline inside a single-sentence claim.
    e.preventDefault();
    if (!onSplit) return;
    const el = e.currentTarget;
    const full = el.textContent ?? '';
    let before = full;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const pre = range.cloneRange();
      pre.selectNodeContents(el);
      pre.setEnd(range.endContainer, range.endOffset);
      before = pre.toString();
    }
    onSplit(before, full.slice(before.length));
  };

  const p = claim.provenance;
  const markerTitle = `${PROVENANCE_LABEL[p]} · ${
    claim.verified
      ? 'verified (click to unmark)'
      : 'not verified (click to mark verified)'
  }`;
  const markerTone =
    p === 'sourced' ? 'green' : p === 'human' ? 'blue' : 'amber';

  return (
    <div
      data-claim-row
      className={`group flex flex-1 items-start gap-2 rounded-md px-1.5 py-1 transition ${
        isSelected ? SELECTED_ROW[p] : 'hover:bg-zinc-50'
      }`}
    >
      <Tooltip label={markerTitle} tone={markerTone} className="mt-1 shrink-0">
        <button
          type="button"
          aria-label={markerTitle}
          aria-pressed={claim.verified}
          onClick={() => onChange({ ...claim, verified: !claim.verified })}
          className={`flex size-4 items-center justify-center rounded-[4px] border-2 text-[10px] leading-none transition ${
            claim.verified ? MARKER_VERIFIED[p] : MARKER_UNVERIFIED[p]
          }`}
        >
          {claim.verified ? '✓' : ''}
        </button>
      </Tooltip>

      <span
        ref={editableRef}
        data-claim-text
        className="min-w-0 flex-1 cursor-text leading-relaxed outline-none"
        contentEditable
        suppressContentEditableWarning
        onClick={() => onSelect(claim)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          const text = e.currentTarget.textContent ?? '';
          if (text !== claim.text)
            onChange({ ...claim, text, provenance: 'human' });
        }}
      >
        {claim.text}
      </span>

      {onDelete && (
        <button
          type="button"
          title="Delete"
          aria-label="Delete claim"
          onClick={onDelete}
          className="mt-0.5 shrink-0 px-1 text-xs text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
        >
          ✕
        </button>
      )}
    </div>
  );
}
