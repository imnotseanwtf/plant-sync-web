import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/types/resource';
import { getUsers } from './service';

export const userKeys = {
  all: ['users'] as const,
  list: (filters: ListFilters) => [...userKeys.all, 'list', filters] as const
};

export const usersQueryOptions = (filters: ListFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });
