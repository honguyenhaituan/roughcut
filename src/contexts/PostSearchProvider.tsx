'use client';

import {
  createContext,
  useContext,
  useDeferredValue,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@/hooks/useQuery';
import type { Post } from '@/types';

interface PostSearchValue {
  term: string;
  setTerm: (term: string) => void;
  results: Post[] | undefined;
  isLoading: boolean;
  isActive: boolean;
}

const PostSearchContext = createContext<PostSearchValue | null>(null);

export function PostSearchProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState('');
  const deferred = useDeferredValue(term).trim();
  const key = deferred ? `/api/posts?q=${encodeURIComponent(deferred)}` : null;
  const { data, isLoading } = useQuery<Post[]>(key);

  // term/data change every keystroke, so this object is meant to be fresh each
  // render — memoizing it would not help. Split into state/actions contexts only
  // if a consumer that needs just `setTerm` starts re-rendering too often.
  const value: PostSearchValue = {
    term,
    setTerm,
    results: data,
    isLoading,
    isActive: key !== null,
  };

  return (
    <PostSearchContext.Provider value={value}>
      {children}
    </PostSearchContext.Provider>
  );
}

export function usePostSearch() {
  const context = useContext(PostSearchContext);
  if (!context) {
    throw new Error('usePostSearch must be used within <PostSearchProvider>');
  }
  return context;
}
