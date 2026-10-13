import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { buttonVariants } from '@/components/ui/button';
import DeviceListing from '@/features/devices/components/device-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Device Identifiers' };

export default async function DeviceIdentifiersPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[
            { label: 'Device Identifiers', href: '/dashboard/device-identifiers' },
            { label: 'List' }
          ]}
          title='Device Identifiers'
          actions={
            <Link href='/dashboard/device-identifiers/create' className={buttonVariants()}>
              New device identifier
            </Link>
          }
        />
        <DeviceListing />
      </div>
    </PageContainer>
  );
}
