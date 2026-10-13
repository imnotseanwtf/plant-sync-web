import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { DeviceForm } from '@/features/devices/components/device-form';

export const metadata = { title: 'Create Device Identifier' };

export default function CreateDeviceIdentifierPage() {
  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[
            { label: 'Device Identifiers', href: '/dashboard/device-identifiers' },
            { label: 'Create' }
          ]}
          title='Create Device Identifier'
        />
        <DeviceForm />
      </div>
    </PageContainer>
  );
}
