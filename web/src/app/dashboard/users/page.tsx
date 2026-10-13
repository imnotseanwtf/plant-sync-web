import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { buttonVariants } from '@/components/ui/button';
import UserListing from '@/features/users/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Users' };

export default async function UsersPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[{ label: 'Users', href: '/dashboard/users' }, { label: 'List' }]}
          title='Users'
          actions={
            <Link href='/dashboard/users/create' className={buttonVariants()}>
              New user
            </Link>
          }
        />
        <UserListing />
      </div>
    </PageContainer>
  );
}
