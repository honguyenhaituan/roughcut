import 'server-only';
import { prisma } from '@/server/db';
import type {
  CreatePostInput,
  UpdatePostInput,
} from '@/server/validations/post.schema';

export const postRepository = {
  findMany() {
    return prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  },
  search(query: string) {
    return prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  findById(id: string) {
    return prisma.post.findUnique({ where: { id } });
  },
  create(data: CreatePostInput) {
    return prisma.post.create({ data });
  },
  update(id: string, data: UpdatePostInput) {
    return prisma.post.update({ where: { id }, data });
  },
  remove(id: string) {
    return prisma.post.delete({ where: { id } });
  },
};
