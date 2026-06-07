'use server';

import { revalidatePath } from 'next/cache';
import { postService } from '@/server/services/post.service';
import { createPostSchema } from '@/server/validations/post.schema';

// ⚠️ SECURITY: Server Actions are PUBLIC endpoints — anyone can invoke them
// directly, like an API route. Once this app has auth, verify the session AND
// authorization at the top of every action below, e.g.:
//   const session = await auth();
//   if (!session) throw new Error('Unauthorized');

export async function createPostAction(formData: FormData) {
  // TODO(auth): require a logged-in user before creating.
  const parsed = createPostSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) {
    // In a real app, surface these via useActionState. Kept simple here.
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  await postService.create(parsed.data);
  revalidatePath('/posts');
}

export async function deletePostAction(id: string) {
  // TODO(auth): require a logged-in user (and ownership check) before deleting.
  await postService.remove(id);
  revalidatePath('/posts');
}
