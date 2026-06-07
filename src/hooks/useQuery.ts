'use client';

import useSWR, { type SWRConfiguration } from 'swr';
import { fetcher, type ApiError, type FetcherOptions } from '@/lib/api_client';

export type UseQueryOptions<T> = SWRConfiguration<T, ApiError> & {
  /** Options forwarded to the underlying fetcher (headers, camelize, ...). */
  fetcherOptions?: FetcherOptions;
};

/**
 * Thin wrapper around `useSWR` with project defaults. Pass `null` as the key to
 * skip the request (conditional fetching).
 *
 *   const { data, error, isLoading } = useQuery<User>('/api/me');
 */
export function useQuery<T>(
  key: string | null,
  options: UseQueryOptions<T> = {},
) {
  const { fetcherOptions, ...swrOptions } = options;

  return useSWR<T, ApiError>(key, fetcher<T>(fetcherOptions), {
    dedupingInterval: 20_000,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ...swrOptions,
  });
}

export default useQuery;
