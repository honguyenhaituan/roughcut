import { describe, it, expect } from 'vitest';
import { validateSourceIds, resolveProvenance } from './generation.service';

describe('validateSourceIds', () => {
  const pool = new Set(['S1', 'S2']);
  it('keeps real ids, drops ghosts', () => {
    expect(validateSourceIds(['S1', 'S9', 'S2'], pool)).toEqual(['S1', 'S2']);
  });
  it('returns empty when all ghosts', () => {
    expect(validateSourceIds(['S7'], pool)).toEqual([]);
  });
});

describe('resolveProvenance', () => {
  it('downgrades sourced to ai_added when no real ids remain', () => {
    expect(resolveProvenance('sourced', [])).toBe('ai_added');
  });
  it('keeps sourced when at least one real id remains', () => {
    expect(resolveProvenance('sourced', ['S1'])).toBe('sourced');
  });
  it('leaves ai_added unchanged', () => {
    expect(resolveProvenance('ai_added', [])).toBe('ai_added');
  });
  it('does not downgrade human provenance', () => {
    expect(resolveProvenance('human', [])).toBe('human');
  });
});
