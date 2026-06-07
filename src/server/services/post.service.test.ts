import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/repositories/post.repository', () => ({
  postRepository: {
    findMany: vi.fn(),
    search: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { postService } from './post.service';
import { postRepository } from '@/server/repositories/post.repository';

describe('postService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list() with no query calls findMany', () => {
    postService.list();
    expect(postRepository.findMany).toHaveBeenCalledOnce();
    expect(postRepository.search).not.toHaveBeenCalled();
  });

  it('list(query) searches with the trimmed term', () => {
    postService.list('  hello  ');
    expect(postRepository.search).toHaveBeenCalledWith('hello');
  });

  it('get() throws when the post is missing', async () => {
    vi.mocked(postRepository.findById).mockResolvedValue(null);
    await expect(postService.get('missing')).rejects.toThrow('not found');
  });
});
