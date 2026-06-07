// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { signSession, verifySession } from './auth';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-test-secret-test-secret';
});

describe('session', () => {
  it('round-trips a payload', async () => {
    const token = await signSession({ userId: 'u1', email: 'a@b.com' });
    expect(await verifySession(token)).toMatchObject({
      userId: 'u1',
      email: 'a@b.com',
    });
  });
  it('rejects a tampered token', async () => {
    expect(await verifySession('garbage.token.here')).toBeNull();
  });
});
