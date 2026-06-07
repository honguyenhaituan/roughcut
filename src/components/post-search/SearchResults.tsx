'use client';

import { usePostSearch } from '@/contexts/PostSearchProvider';

export function SearchResults() {
  const { results, isLoading, isActive } = usePostSearch();

  if (!isActive) return null;

  return (
    <div className="mt-3 text-sm">
      {isLoading && <p className="text-zinc-500">Searching…</p>}
      {results && results.length === 0 && (
        <p className="text-zinc-500">No posts match your search.</p>
      )}
      {results && results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((post) => (
            <li
              key={post.id}
              className="rounded bg-zinc-100 px-3 py-2 dark:bg-zinc-800"
            >
              {post.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
