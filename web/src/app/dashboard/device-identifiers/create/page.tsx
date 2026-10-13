import PageContainer from '@/components/layout/page-container';
import { DeviceForm } from '@/features/devices/components/device-form';

export const metadata = { title: 'Create Device Identifier' };

export default function CreateDeviceIdentifierPage() {
  return (
    <PageContainer
      pageTitle='Create Device Identifier'
      pageDescription='The device gets a unique ID you copy into the ESP32 firmware.'
    >
      <DeviceForm />
    </PageContainer>
  );
}
