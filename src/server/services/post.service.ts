import 'server-only';
import { postRepository } from '@/server/repositories/post.repository';
import type {
  CreatePostInput,
  UpdatePostInput,
} from '@/server/validations/post.schema';

/**
 * Business logic for posts. Inputs are expected to be already validated at the
 * boundary (route handler / server action) using the Zod schemas. Keep route
 * handlers and actions thin — put reusable logic here.
 */
export const postService = {
  list(query?: string) {
    return query?.trim()
      ? postRepository.search(query.trim())
      : postRepository.findMany();
  },

  async get(id: string) {
    const post = await postRepository.findById(id);
    if (!post) throw new Error(`Post ${id} not found`);
    return post;
  },

  create(input: CreatePostInput) {
    return postRepository.create(input);
  },

  update(id: string, input: UpdatePostInput) {
    return postRepository.update(id, input);
  },

  remove(id: string) {
    return postRepository.remove(id);
  },
};
