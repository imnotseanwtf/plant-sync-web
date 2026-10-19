import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import DeviceListing from '@/features/devices/components/device-listing';
import { DeviceFormSheetTrigger } from '@/features/devices/components/device-form-sheet';
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
      pageHeaderAction={<DeviceFormSheetTrigger />}
    >
      <DeviceListing />
    </PageContainer>
  );
}
