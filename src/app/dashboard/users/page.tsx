import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import UserListing from '@/features/users/components/user-listing';
import { UserFormSheetTrigger } from '@/features/users/components/user-form-sheet';
import { requirePagePermission } from '@/lib/auth/current-user';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Users' };

export default async function UsersPage(props: { searchParams: Promise<SearchParams> }) {
  await requirePagePermission('view:users');
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Users'
      pageDescription='People who can sign in to this dashboard.'
      pageHeaderAction={<UserFormSheetTrigger />}
    >
      <UserListing />
    </PageContainer>
  );
}
