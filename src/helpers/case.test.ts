import { describe, expect, it } from 'vitest';
import { camelizeKeys, snakeizeKeys } from './case';

describe('camelizeKeys', () => {
  it('converts nested snake_case keys to camelCase', () => {
    const input = {
      user_id: 1,
      nested_obj: { first_name: 'Ada' },
      list: [{ created_at: 't' }],
    };
    expect(camelizeKeys(input)).toEqual({
      userId: 1,
      nestedObj: { firstName: 'Ada' },
      list: [{ createdAt: 't' }],
    });
  });

  it('leaves primitives untouched', () => {
    expect(camelizeKeys('hello')).toBe('hello');
    expect(camelizeKeys(42)).toBe(42);
  });
});

describe('snakeizeKeys', () => {
  it('converts camelCase keys back to snake_case', () => {
    expect(
      snakeizeKeys({ userId: 1, nestedObj: { firstName: 'Ada' } }),
    ).toEqual({ user_id: 1, nested_obj: { first_name: 'Ada' } });
  });
});
