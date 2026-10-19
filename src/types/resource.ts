export type ListFilters = {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  /** Active filter values by filter id; each service allow-lists the ids and values it accepts. */
  filters?: Record<string, string>;
};

/** A dropdown filter above a table. Choosing nothing means "all". */
export type FilterDef = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export type ListResponse<T> = { rows: T[]; total: number };

export const PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;
