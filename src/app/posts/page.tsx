import { postService } from '@/server/services/post.service';
import { PostSearchProvider } from '@/contexts/PostSearchProvider';
import { SearchInput } from '@/components/post-search/SearchInput';
import { SearchResults } from '@/components/post-search/SearchResults';
import { createPostAction, deletePostAction } from './actions';

// Reads from the DB on every request — not prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const posts = await postService.list();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Server Component reading directly via <code>postService</code>; writes
        go through Server Actions.
      </p>

      {/* Search state lifted into a provider so input + results can sit apart. */}
      <PostSearchProvider>
        <div className="mt-8">
          <SearchInput />
          <SearchResults />
        </div>
      </PostSearchProvider>

      <form action={createPostAction} className="mt-8 flex flex-col gap-3">
        <input
          name="title"
          placeholder="Title"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="body"
          placeholder="Write something..."
          required
          rows={3}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publish immediately
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add post
        </button>
      </form>

      <ul className="mt-10 flex flex-col gap-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium">{post.title}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {post.body}
                </p>
                {!post.published && (
                  <span className="mt-2 inline-block text-xs text-amber-600">
                    Draft
                  </span>
                )}
              </div>
              <form action={deletePostAction.bind(null, post.id)}>
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
