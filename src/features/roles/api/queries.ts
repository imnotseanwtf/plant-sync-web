import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/types/resource';
import { getRoleOptions, getRoles } from './service';

export const roleKeys = {
  all: ['roles'] as const,
  list: (filters: ListFilters) => [...roleKeys.all, 'list', filters] as const,
  options: () => [...roleKeys.all, 'options'] as const
};

export const rolesQueryOptions = (filters: ListFilters) =>
  queryOptions({
    queryKey: roleKeys.list(filters),
    queryFn: () => getRoles(filters)
  });

/** Role names for pickers and filters (shared by the user form and the users table). */
export const roleOptionsQueryOptions = () =>
  queryOptions({
    queryKey: roleKeys.options(),
    queryFn: () => getRoleOptions(),
    staleTime: 30_000
  });
