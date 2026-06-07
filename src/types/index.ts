export type Nullable<T> = T | null;

export type {
  Claim,
  ArticleContent,
  Segment,
  Media,
  PlanOutput,
  DraftOutput,
} from '@/server/validations/article.schema';

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
