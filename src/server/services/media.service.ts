import 'server-only';
import { put } from '@vercel/blob';
import { env } from '@/helpers/env';
import type { Media } from '@/server/validations/article.schema';

export const mediaService = {
  async uploadExtracted(
    images: { buffer: Buffer; mimeType: string; sourceFileName: string }[],
  ): Promise<Media[]> {
    return Promise.all(
      images.map(async (img) => {
        const id = crypto.randomUUID();
        const ext = img.mimeType.split('/')[1] ?? 'png';
        const blob = await put(`articles/${id}.${ext}`, img.buffer, {
          access: 'public',
          contentType: img.mimeType,
          token: env.blobToken(),
        });
        return {
          id,
          src: blob.url,
          sourceFileName: img.sourceFileName,
          origin: 'extracted' as const,
          mimeType: img.mimeType,
        };
      }),
    );
  },

  async uploadOne(file: {
    buffer: Buffer;
    mimeType: string;
    name: string;
  }): Promise<Media> {
    const id = crypto.randomUUID();
    const blob = await put(`articles/${id}`, file.buffer, {
      access: 'public',
      contentType: file.mimeType,
      token: env.blobToken(),
    });
    return {
      id,
      src: blob.url,
      sourceFileName: file.name,
      origin: 'uploaded' as const,
      mimeType: file.mimeType,
    };
  },
};
