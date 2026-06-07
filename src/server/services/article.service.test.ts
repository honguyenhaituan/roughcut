import { describe, it, expect, vi, beforeEach } from 'vitest';
import { articleService } from './article.service';
import { articleRepository } from '@/server/repositories/article.repository';

vi.mock('@/server/repositories/article.repository', () => ({
  articleRepository: {
    findByIdForUser: vi.fn(),
    findByPublicId: vi.fn(),
    update: vi.fn(),
  },
}));
beforeEach(() => vi.clearAllMocks());
const repo = vi.mocked(articleRepository);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const row = (over: Record<string, unknown> = {}): any => ({
  id: 'a1',
  userId: 'u1',
  title: 'T',
  articleType: 'pocket_guide',
  status: 'ready',
  content: {},
  sourceSegments: [],
  media: [],
  published: false,
  publishedAt: null,
  publicId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('articleService.publish', () => {
  it('generates a publicId and sets the publish flags on first publish', async () => {
    repo.findByIdForUser.mockResolvedValue(row());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repo.update.mockResolvedValue({ count: 1 } as any);
    const { publicId } = await articleService.publish('a1', 'u1');
    expect(publicId).toMatch(/.+/);
    const data = repo.update.mock.calls[0][2];
    expect(data).toMatchObject({ published: true, publicId });
    expect(data.publishedAt).toBeInstanceOf(Date);
  });

  it('reuses an existing publicId', async () => {
    repo.findByIdForUser.mockResolvedValue(row({ publicId: 'fixed-token' }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repo.update.mockResolvedValue({ count: 1 } as any);
    const { publicId } = await articleService.publish('a1', 'u1');
    expect(publicId).toBe('fixed-token');
  });

  it('throws NOT_FOUND when the article is not owned', async () => {
    repo.findByIdForUser.mockResolvedValue(null);
    await expect(articleService.publish('a1', 'u1')).rejects.toThrow(
      'NOT_FOUND',
    );
  });
});

describe('articleService.unpublish', () => {
  it('clears published but keeps publicId', async () => {
    repo.findByIdForUser.mockResolvedValue(
      row({ published: true, publicId: 'tok' }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repo.update.mockResolvedValue({ count: 1 } as any);
    await articleService.unpublish('a1', 'u1');
    const data = repo.update.mock.calls[0][2];
    expect(data).toMatchObject({ published: false });
    expect(data.publicId).toBeUndefined();
  });

  it('throws NOT_FOUND when the article is not owned', async () => {
    repo.findByIdForUser.mockResolvedValue(null);
    await expect(articleService.unpublish('a1', 'u1')).rejects.toThrow(
      'NOT_FOUND',
    );
  });
});

describe('articleService.update', () => {
  it('passes a valid status through to the repository', async () => {
    repo.findByIdForUser.mockResolvedValue(row({ sourceSegments: [] }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repo.update.mockResolvedValue({ count: 1 } as any);
    await articleService.update('a1', 'u1', { status: 'planned' });
    const data = repo.update.mock.calls[0][2];
    expect(data).toMatchObject({ status: 'planned' });
  });

  it('rejects an unknown status without writing', async () => {
    repo.findByIdForUser.mockResolvedValue(row({ sourceSegments: [] }));
    await expect(
      articleService.update('a1', 'u1', { status: 'bogus' }),
    ).rejects.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('articleService.getPublic', () => {
  it('returns only title/content/media for a published article', async () => {
    repo.findByPublicId.mockResolvedValue(
      row({ published: true, publicId: 'tok', title: 'Hi' }),
    );
    const res = await articleService.getPublic('tok');
    expect(res).toEqual({ title: 'Hi', content: {}, media: [] });
    expect(res).not.toHaveProperty('userId');
    expect(res).not.toHaveProperty('sourceSegments');
  });

  it('returns null when not found / unpublished', async () => {
    repo.findByPublicId.mockResolvedValue(null);
    expect(await articleService.getPublic('nope')).toBeNull();
  });
});
