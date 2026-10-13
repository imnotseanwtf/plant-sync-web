import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { devicesQueryOptions } from '../api/queries';
import { DevicesTable } from './devices-table';

export default function DeviceListingPage() {
  const search = searchParamsCache.get('name');
  const sort = searchParamsCache.get('sort');

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    devicesQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage'),
      ...(search && { search }),
      ...(sort && { sort })
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DevicesTable />
    </HydrationBoundary>
  );
}
