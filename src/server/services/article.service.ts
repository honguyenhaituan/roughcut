import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { articleRepository } from '@/server/repositories/article.repository';
import { parseFiles } from './parse.service';
import { segmentSources } from './resegment.service';
import { mediaService } from './media.service';
import { plan, draftSection } from './generation.service';
import {
  contentSchema,
  type ArticleContent,
  type Segment,
  type Media,
} from '@/server/validations/article.schema';

const POOL = 4;

async function pooled<T, R>(
  items: T[],
  n: number,
  fn: (t: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

function sanitizeContent(
  content: ArticleContent,
  pool: Set<string>,
): ArticleContent {
  const fix = <T extends { sourceSegmentIds: string[] }>(c: T): T => ({
    ...c,
    sourceSegmentIds: c.sourceSegmentIds.filter((x) => pool.has(x)),
  });
  return {
    ...content,
    hookSubtitle: fix(content.hookSubtitle),
    intro: fix(content.intro),
    sections: content.sections.map((s) => ({
      ...fix(s),
      body: s.body.map(fix),
    })),
    keyFacts: content.keyFacts.map(fix),
    bestFor: content.bestFor.map(fix),
    notFor: content.notFor.map(fix),
    ethicsSafety: content.ethicsSafety.map(fix),
    topTips: content.topTips.map(fix),
    faq: content.faq.map((f) => ({ ...f, a: fix(f.a) })),
  };
}

export const articleService = {
  async createFromFiles(
    userId: string,
    files: { name: string; buffer: Buffer; mimeType: string }[],
  ) {
    const {
      segments: syntactic,
      sources,
      images,
      truncated: parseTruncated,
      skipped,
    } = await parseFiles(files);
    if (syntactic.length === 0) {
      throw new Error(
        skipped[0]?.reason ?? 'No usable text found in the uploaded files',
      );
    }
    // AI regroups the syntactic fragments into semantically-coherent segments;
    // falls back to the syntactic split on any LLM/validation failure.
    const { segments, truncated } = await segmentSources(sources, {
      segments: syntactic,
      truncated: parseTruncated,
    });
    const media = images.length
      ? await mediaService.uploadExtracted(images)
      : [];
    const { title, articleType, content } = await plan(segments);
    const article = await articleRepository.create({
      userId,
      title: title || 'Untitled',
      articleType,
      status: 'planned',
      content: content as unknown as Prisma.InputJsonValue,
      sourceSegments: segments as unknown as Prisma.InputJsonValue,
      media: media as unknown as Prisma.InputJsonValue,
    });
    return { article, truncated, skipped };
  },

  get: (id: string, userId: string) =>
    articleRepository.findByIdForUser(id, userId),

  list: (userId: string) => articleRepository.listForUser(userId),

  remove: (id: string, userId: string) => articleRepository.remove(id, userId),

  async update(
    id: string,
    userId: string,
    patch: { title?: string; content?: ArticleContent; status?: string },
  ) {
    const existing = await articleRepository.findByIdForUser(id, userId);
    if (!existing) throw new Error('NOT_FOUND');
    let content = patch.content;
    if (content) {
      const pool = new Set(
        (existing.sourceSegments as Segment[]).map((s) => s.id),
      );
      content = sanitizeContent(contentSchema.parse(content), pool);
    }
    await articleRepository.update(id, userId, {
      ...(patch.title !== undefined && { title: patch.title }),
      ...(content && {
        content: content as unknown as Prisma.InputJsonValue,
      }),
      ...(patch.status && { status: patch.status }),
    });
    return articleRepository.findByIdForUser(id, userId);
  },

  async addMedia(
    id: string,
    userId: string,
    file: { buffer: Buffer; mimeType: string; name: string },
  ) {
    const article = await articleRepository.findByIdForUser(id, userId);
    if (!article) throw new Error('NOT_FOUND');
    const item = await mediaService.uploadOne(file);
    const media = [...(article.media as Media[]), item];
    await articleRepository.update(id, userId, {
      media: media as unknown as Prisma.InputJsonValue,
    });
    return item;
  },

  async draftSections(id: string, userId: string, sectionIds?: string[]) {
    const article = await articleRepository.findByIdForUser(id, userId);
    if (!article) throw new Error('NOT_FOUND');
    await articleRepository.update(id, userId, { status: 'drafting' });
    // Per-section errors are absorbed below; this guards the surrounding work so
    // a soft failure can't strand the row in `drafting` (a hard timeout can —
    // the client offers a "retry drafting" affordance for that case).
    try {
      const content = article.content as ArticleContent;
      const segments = article.sourceSegments as Segment[];
      const targets = content.sections.filter(
        (s) => !sectionIds || sectionIds.includes(s.id),
      );
      const outline = content.sections.map((s) => s.heading);
      const results = await pooled(targets, POOL, async (s) => {
        try {
          const body = await draftSection({
            heading: s.heading,
            intent: s.intent,
            hook: content.hookSubtitle.text,
            outline,
            segments,
            assignedIds: s.sourceSegmentIds,
          });
          return { id: s.id, body, draftError: false };
        } catch {
          return { id: s.id, body: [], draftError: true };
        }
      });
      const byId = new Map(results.map((r) => [r.id, r]));
      content.sections = content.sections.map((s) =>
        byId.has(s.id)
          ? {
              ...s,
              body: byId.get(s.id)!.body,
              draftError: byId.get(s.id)!.draftError,
            }
          : s,
      );
      await articleRepository.update(id, userId, {
        content: content as unknown as Prisma.InputJsonValue,
        status: 'ready',
      });
      return articleRepository.findByIdForUser(id, userId);
    } catch (e) {
      await articleRepository.update(id, userId, { status: 'ready' });
      throw e;
    }
  },
};
