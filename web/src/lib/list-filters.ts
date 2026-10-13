import type { ListFilters } from '@/types/resource';

export type SortingEntry = { id: string; desc: boolean };

/** Parse the `sort` search param written by nuqs (JSON `[{ id, desc }]`); bad input means no sorting. */
export function parseSortParam(raw: string | null | undefined): SortingEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s?.id === 'string').map((s) => ({ id: s.id, desc: !!s.desc }))
      : [];
  } catch {
    return [];
  }
}

/**
 * Build the list filters from URL state. The server prefetch and the client table both call this,
 * so their query keys are identical and the hydrated data is reused.
 */
export function toListFilters(input: {
  page: number;
  perPage: number;
  name?: string | null;
  sorting: SortingEntry[];
}): ListFilters {
  const [first] = input.sorting;
  return {
    page: input.page,
    limit: input.perPage,
    ...(input.name && { search: input.name }),
    ...(first && { sort: first.id, dir: first.desc ? ('desc' as const) : ('asc' as const) })
  };
}
