import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import { UserTable } from './user-table';

export default async function UserListing() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    usersQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage')
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTable />
    </HydrationBoundary>
  );
}
