import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import UserListing from '@/features/users/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Users' };

export default async function UsersPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Users'
      pageDescription='People who can sign in to this dashboard.'
      pageHeaderAction={
        <Link href='/dashboard/users/create' className={buttonVariants()}>
          <Icons.add className='mr-2 h-4 w-4' /> New user
        </Link>
      }
    >
      <UserListing />
    </PageContainer>
  );
}
