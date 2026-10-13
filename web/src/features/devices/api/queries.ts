import { queryOptions } from '@tanstack/react-query';
import { getDeviceOptions, getDevices } from './service';
import type { DeviceFilters } from './types';

export const deviceKeys = {
  all: ['devices'] as const,
  list: (filters: DeviceFilters) => [...deviceKeys.all, 'list', filters] as const,
  options: (plantId?: number) => [...deviceKeys.all, 'options', plantId ?? null] as const
};

export const devicesQueryOptions = (filters: DeviceFilters) =>
  queryOptions({
    queryKey: deviceKeys.list(filters),
    queryFn: () => getDevices(filters)
  });

export const deviceOptionsQueryOptions = (plantId?: number) =>
  queryOptions({
    queryKey: deviceKeys.options(plantId),
    queryFn: () => getDeviceOptions(plantId)
  });
