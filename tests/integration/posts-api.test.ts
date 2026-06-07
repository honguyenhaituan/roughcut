import { beforeEach, describe, expect, it, vi } from 'vitest';

// Integration: route handler → service → repository, with only the DB (Prisma)
// mocked. Exercises Zod validation and the full server call chain together.
vi.mock('@/server/db', () => ({
  prisma: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/posts/route';
import { prisma } from '@/server/db';

const sample = {
  id: 'c1',
  title: 'Hello',
  body: 'World',
  published: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function postRequest(body: unknown) {
  return new Request('http://localhost/api/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/posts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET returns the list of posts', async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([sample]);
    const res = await GET(new Request('http://localhost/api/posts'));
    console.log(res);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('Hello');
  });

  it('POST rejects invalid input with 422 and never touches the DB', async () => {
    const res = await POST(postRequest({ title: '' }));
    expect(res.status).toBe(422);
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('POST creates a post with valid input', async () => {
    vi.mocked(prisma.post.create).mockResolvedValue(sample);
    const res = await POST(postRequest({ title: 'Hello', body: 'World' }));
    expect(res.status).toBe(201);
    expect(prisma.post.create).toHaveBeenCalledOnce();
  });
});
