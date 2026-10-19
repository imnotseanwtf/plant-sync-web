import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { rolesQueryOptions } from '../api/queries';
import { RoleTable } from './role-table';

export default async function RoleListing() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    rolesQueryOptions({
      page: searchParamsCache.get('page'),
      limit: searchParamsCache.get('perPage')
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RoleTable />
    </HydrationBoundary>
  );
}
