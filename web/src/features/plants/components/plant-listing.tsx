import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { plantsQueryOptions } from '../api/queries';
import { PlantTable } from './plant-table';

export default async function PlantListing() {
  const search = searchParamsCache.get('search');
  const sort = searchParamsCache.get('sort');
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    plantsQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage'),
      ...(search && { search }),
      ...(sort && {
        sort,
        dir: searchParamsCache.get('dir') === 'desc' ? ('desc' as const) : ('asc' as const)
      })
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlantTable />
    </HydrationBoundary>
  );
}
