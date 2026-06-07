import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/articles/[id]/publish/route';
import { getSessionUser } from '@/server/auth';
import { articleService } from '@/server/services/article.service';

vi.mock('@/server/auth', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/server/services/article.service', () => ({
  articleService: { publish: vi.fn(), unpublish: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());

const params = Promise.resolve({ id: 'a1' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const req = (): any =>
  new Request('http://test/api/articles/a1/publish', { method: 'POST' });
const session = { userId: 'u1', email: 'a@b.com' };

describe('POST /api/articles/[id]/publish', () => {
  it('returns 401 without a session', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await POST(req(), { params });
    expect(res.status).toBe(401);
    expect(articleService.publish).not.toHaveBeenCalled();
  });

  it('publishes for the owner', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session);
    vi.mocked(articleService.publish).mockResolvedValue({ publicId: 'tok' });
    const res = await POST(req(), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ publicId: 'tok' });
    expect(articleService.publish).toHaveBeenCalledWith('a1', 'u1');
  });

  it('returns 404 when the article is not owned', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session);
    vi.mocked(articleService.publish).mockRejectedValue(new Error('NOT_FOUND'));
    const res = await POST(req(), { params });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/articles/[id]/publish', () => {
  it('returns 401 without a session', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await DELETE(req(), { params });
    expect(res.status).toBe(401);
  });

  it('unpublishes for the owner', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(session);
    vi.mocked(articleService.unpublish).mockResolvedValue(undefined);
    const res = await DELETE(req(), { params });
    expect(res.status).toBe(200);
    expect(articleService.unpublish).toHaveBeenCalledWith('a1', 'u1');
  });
});
