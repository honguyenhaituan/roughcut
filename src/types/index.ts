export type Nullable<T> = T | null;

/** A post as returned by the API (dates are serialized to ISO strings). */
export interface Post {
  id: string;
  title: string;
  body: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface Pagination {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}
