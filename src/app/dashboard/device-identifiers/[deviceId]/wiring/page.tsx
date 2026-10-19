import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { getDevice } from '@/features/devices/api/service';
import { DeviceWiringForm } from '@/features/devices/components/device-wiring-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'Device Wiring' };

/** Where a device's board and sensors are designed; the diagram on the plant page follows it. */
export default async function DeviceWiringPage({
  params
}: {
  params: Promise<{ deviceId: string }>;
}) {
  await requirePagePermission('edit:devices');
  const { deviceId } = await params;
  const device = await getDevice(deviceId);
  if (!device) notFound();

  return (
    <PageContainer
      pageTitle={`Wiring: ${device.name}`}
      pageDescription='Choose the board and the parts wired to it, then assign each part’s pins.'
      pageHeaderAction={
        <Link
          href='/dashboard/device-identifiers'
          className={buttonVariants({ variant: 'outline' })}
        >
          Back to device identifiers
        </Link>
      }
    >
      <DeviceWiringForm device={device} />
    </PageContainer>
  );
}
