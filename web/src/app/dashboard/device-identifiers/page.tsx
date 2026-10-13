import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import DeviceListing from '@/features/devices/components/device-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Device Identifiers' };

export default async function DeviceIdentifiersPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Device Identifiers'
      pageDescription='ESP32 boards that report sensor readings.'
      pageHeaderAction={
        <Link href='/dashboard/device-identifiers/create' className={buttonVariants()}>
          <Icons.add className='mr-2 h-4 w-4' /> New device identifier
        </Link>
      }
    >
      <DeviceListing />
    </PageContainer>
  );
}
