export type Nullable<T> = T | null;

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
