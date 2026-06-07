import { z } from 'zod';

// Input validation lives at the I/O boundary (route handlers & server actions).
// Services and repositories trust the already-validated, typed input.

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required'),
  published: z.boolean().optional().default(false),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
