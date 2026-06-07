import { camelizeKeys } from '@/helpers/case';
import type { ApiErrorResponse } from '@/types';

/** Base URL for the backend API, configured via env (empty = same origin). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/** Error thrown by the fetcher on a failed request. Carries the HTTP status. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | null | undefined;

/** Build a full URL from a path and optional query params. */
export function buildUrl(
  path: string,
  params?: Record<string, QueryValue>,
): string {
  const base = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export interface FetcherOptions extends RequestInit {
  /** Camelize snake_case keys in the JSON response. Defaults to true. */
  camelize?: boolean;
}

/**
 * SWR-compatible fetcher factory. Returns `(url) => Promise<T>` and throws
 * `ApiError` (with the HTTP status) on any non-2xx response.
 */
export function fetcher<T>({ camelize = true, ...init }: FetcherOptions = {}) {
  return async (url: string): Promise<T> => {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...((init.headers as Record<string, string>) ?? {}),
      },
    });

    const json = res.status === 204 ? null : await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (json as ApiErrorResponse | null)?.error ??
        'An internal error occurred';
      throw new ApiError(message, res.status);
    }

    return camelize ? camelizeKeys<T>(json) : (json as T);
  };
}
