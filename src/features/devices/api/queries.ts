import { queryOptions } from '@tanstack/react-query';
import type { ListFilters } from '@/types/resource';
import { getDeviceOptions, getDevices } from './service';

export const deviceKeys = {
  all: ['devices'] as const,
  list: (filters: ListFilters) => [...deviceKeys.all, 'list', filters] as const,
  options: () => [...deviceKeys.all, 'options'] as const
};

export const devicesQueryOptions = (filters: ListFilters) =>
  queryOptions({
    queryKey: deviceKeys.list(filters),
    queryFn: () => getDevices(filters)
  });

export const deviceOptionsQueryOptions = () =>
  queryOptions({
    queryKey: deviceKeys.options(),
    queryFn: () => getDeviceOptions()
  });
