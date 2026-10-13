import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getDevice } from '@/features/devices/api/service';
import { DeviceDeleteButton } from '@/features/devices/components/device-delete-button';
import { DeviceForm } from '@/features/devices/components/device-form';

export const metadata = { title: 'Edit Device Identifier' };

export default async function EditDeviceIdentifierPage({
  params
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = await params;
  const device = await getDevice(deviceId);
  if (!device) notFound();

  return (
    <PageContainer
      pageTitle='Edit Device Identifier'
      pageDescription='Renaming keeps the ID, so the firmware keeps working.'
      pageHeaderAction={<DeviceDeleteButton id={device.id} />}
    >
      <DeviceForm device={device} />
    </PageContainer>
  );
}
