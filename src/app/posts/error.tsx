'use client';

// Catches errors from the /posts page or its Server Actions (e.g. DB unreachable).
export default function PostsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Couldn’t load posts
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {error.message || 'Something went wrong.'} Make sure Postgres is running
        and <code>DATABASE_URL</code> is set, then run{' '}
        <code>pnpm db:migrate</code>.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Try again
      </button>
    </main>
  );
}
