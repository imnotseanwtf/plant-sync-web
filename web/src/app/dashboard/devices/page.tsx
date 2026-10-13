import PageContainer from '@/components/layout/page-container';
import DeviceListingPage from '@/features/devices/components/device-listing';
import { DeviceFormSheetTrigger } from '@/features/devices/components/device-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Devices' };

export default async function DevicesPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Devices'
      pageDescription='ESP32 devices that report sensor readings.'
      pageHeaderAction={<DeviceFormSheetTrigger />}
    >
      <DeviceListingPage />
    </PageContainer>
  );
}
