import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/types/resource';
import { getPlantOverview, getPlants } from './service';

export const plantKeys = {
  all: ['plants'] as const,
  list: (filters: ListFilters) => [...plantKeys.all, 'list', filters] as const,
  overview: (id: number) => [...plantKeys.all, 'overview', id] as const
};

export const plantsQueryOptions = (filters: ListFilters) =>
  queryOptions({
    queryKey: plantKeys.list(filters),
    queryFn: () => getPlants(filters)
  });

/** Polled every 5s, like the Filament widgets it replaces. */
export const plantOverviewQueryOptions = (id: number) =>
  queryOptions({
    queryKey: plantKeys.overview(id),
    queryFn: () => getPlantOverview(id),
    refetchInterval: 5000
  });
