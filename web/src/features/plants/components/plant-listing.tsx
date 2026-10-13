import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { toListFilters, parseSortParam } from '@/lib/list-filters';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { plantsQueryOptions } from '../api/queries';
import { PlantTable } from './plant-table';

export default async function PlantListing() {
  const queryClient = getQueryClient();
  // Awaited so the server render already has the rows (no hydration mismatch).
  await queryClient.prefetchQuery(
    plantsQueryOptions(
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
      <PlantTable />
    </HydrationBoundary>
  );
}
