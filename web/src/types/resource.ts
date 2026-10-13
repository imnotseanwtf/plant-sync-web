export type ListFilters = {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
};

export type ListResponse<T> = { rows: T[]; total: number };

export const PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;
