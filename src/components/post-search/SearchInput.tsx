'use client';

import { usePostSearch } from '@/contexts/PostSearchProvider';

export function SearchInput() {
  const { term, setTerm } = usePostSearch();

  return (
    <input
      type="search"
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder="Search posts (live, via /api/posts)…"
      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    />
  );
}
