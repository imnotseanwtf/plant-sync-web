import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getDevice } from '@/features/devices/api/service';
import { DeviceDeleteButton, DeviceForm } from '@/features/devices/components/device-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'Edit Device Identifier' };

export default async function EditDevicePage({
  params
}: {
  params: Promise<{ deviceId: string }>;
}) {
  await requirePagePermission('view:devices');
  const { deviceId } = await params;
  const device = await getDevice(deviceId);
  if (!device) notFound();

  return (
    <PageContainer
      pageTitle={`Edit Device Identifier: ${device.name}`}
      pageDescription='The name, and the board and sensors wired to it.'
      pageHeaderAction={<DeviceDeleteButton device={device} />}
    >
      <DeviceForm device={device} />
    </PageContainer>
  );
}
