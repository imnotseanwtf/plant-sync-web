import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { toListFilters, parseSortParam } from '@/lib/list-filters';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { devicesQueryOptions } from '../api/queries';
import { DeviceTable } from './device-table';

export default async function DeviceListing() {
  const queryClient = getQueryClient();
  // Awaited so the server render already has the rows (no hydration mismatch).
  await queryClient.prefetchQuery(
    devicesQueryOptions(
      toListFilters({
        page: searchParamsCache.get('page'),
        perPage: searchParamsCache.get('perPage'),
        name: searchParamsCache.get('name'),
        sorting: parseSortParam(searchParamsCache.get('sort'))
      })
    )
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeviceTable />
    </HydrationBoundary>
  );
}
