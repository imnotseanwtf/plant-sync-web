import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import DeviceListing from '@/features/devices/components/device-listing';
import { CreateLink } from '@/components/resource/create-link';
import { requirePagePermission } from '@/lib/auth/current-user';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Device Identifiers' };

export default async function DeviceIdentifiersPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePagePermission('view:devices');
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Device Identifiers'
      pageDescription='ESP32 boards that report sensor readings.'
      pageHeaderAction={
        <CreateLink
          href='/dashboard/device-identifiers/new'
          label='New device identifier'
          permission='create:devices'
        />
      }
    >
      <DeviceListing />
    </PageContainer>
  );
}
