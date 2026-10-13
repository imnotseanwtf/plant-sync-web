import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
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
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[
            { label: 'Device Identifiers', href: '/dashboard/device-identifiers' },
            { label: 'Edit' }
          ]}
          title='Edit Device Identifier'
          actions={<DeviceDeleteButton id={device.id} />}
        />
        <DeviceForm device={device} />
      </div>
    </PageContainer>
  );
}
