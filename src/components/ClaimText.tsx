'use client';

import type { Claim } from '@/types';

const tint: Record<Claim['provenance'], string> = {
  sourced: 'bg-green-50 border-green-300',
  ai_added: 'bg-amber-50 border-amber-300',
  human: 'bg-blue-50 border-blue-300',
};

interface Props {
  claim: Claim;
  onSelect: (c: Claim) => void;
  onChange: (c: Claim) => void;
}

export function ClaimText({ claim, onSelect, onChange }: Props) {
  return (
    <span className={`inline rounded border px-1 ${tint[claim.provenance]}`}>
      <span
        className="cursor-text outline-none"
        contentEditable
        suppressContentEditableWarning
        onClick={() => onSelect(claim)}
        onBlur={(e) => {
          const text = e.currentTarget.textContent ?? '';
          if (text !== claim.text)
            onChange({ ...claim, text, provenance: 'human' });
        }}
      >
        {claim.text}
      </span>
      <button
        type="button"
        title={claim.verified ? 'Verified' : 'Mark verified'}
        onClick={() => onChange({ ...claim, verified: !claim.verified })}
        className={`ml-1 text-xs ${claim.verified ? 'text-green-700' : 'text-gray-400'}`}
      >
        {claim.verified ? '✓' : '○'}
      </button>
      {claim.provenance === 'ai_added' && !claim.verified && (
        <em className="ml-1 text-xs text-amber-700">verify</em>
      )}
    </span>
  );
}
