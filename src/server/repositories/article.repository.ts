import 'server-only';
import { prisma } from '@/server/db';
import type { Prisma } from '@/generated/prisma/client';

export const articleRepository = {
  create: (data: Prisma.ArticleUncheckedCreateInput) =>
    prisma.article.create({ data }),

  findByIdForUser: (id: string, userId: string) =>
    prisma.article.findFirst({ where: { id, userId } }),

  // Public read — the ONLY lookup not scoped by userId, so it MUST require
  // published: true inline.
  findByPublicId: (publicId: string) =>
    prisma.article.findFirst({ where: { publicId, published: true } }),

  listForUser: (userId: string) =>
    prisma.article.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, updatedAt: true },
    }),

  update: (id: string, userId: string, data: Prisma.ArticleUpdateInput) =>
    prisma.article.updateMany({ where: { id, userId }, data }),

  // updateMany/deleteMany with { id, userId } make ownership part of the WHERE
  // clause — no rows are touched if the caller isn't the owner.
  remove: (id: string, userId: string) =>
    prisma.article.deleteMany({ where: { id, userId } }),
};
