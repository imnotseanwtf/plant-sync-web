import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { devicesQueryOptions } from '../api/queries';
import { DeviceTable } from './device-table';

export default async function DeviceListing() {
  const sort = searchParamsCache.get('sort');
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    devicesQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage'),
      ...(sort && {
        sort,
        dir: searchParamsCache.get('dir') === 'desc' ? ('desc' as const) : ('asc' as const)
      })
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeviceTable />
    </HydrationBoundary>
  );
}
