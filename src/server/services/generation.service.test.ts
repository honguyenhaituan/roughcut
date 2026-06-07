import { describe, it, expect } from 'vitest';
import { validateSourceIds } from './generation.service';

describe('validateSourceIds', () => {
  const pool = new Set(['S1', 'S2']);
  it('keeps real ids, drops ghosts', () => {
    expect(validateSourceIds(['S1', 'S9', 'S2'], pool)).toEqual(['S1', 'S2']);
  });
  it('returns empty when all ghosts', () => {
    expect(validateSourceIds(['S7'], pool)).toEqual([]);
  });
});
