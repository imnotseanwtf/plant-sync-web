import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { plantsQueryOptions } from '../api/queries';
import { PlantsTable } from './plants-table';

export default function PlantListingPage() {
  const search = searchParamsCache.get('name');
  const sort = searchParamsCache.get('sort');

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    plantsQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage'),
      ...(search && { search }),
      ...(sort && { sort })
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlantsTable />
    </HydrationBoundary>
  );
}
