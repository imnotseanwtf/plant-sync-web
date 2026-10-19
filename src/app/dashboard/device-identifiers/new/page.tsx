import PageContainer from '@/components/layout/page-container';
import { DeviceForm } from '@/features/devices/components/device-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'New Device Identifier' };

export default async function NewDevicePage() {
  await requirePagePermission('create:devices');
  return (
    <PageContainer
      pageTitle='New Device Identifier'
      pageDescription='Name the device and design its board and sensor wiring.'
    >
      <DeviceForm />
    </PageContainer>
  );
}
