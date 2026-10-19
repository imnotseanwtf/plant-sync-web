'use client';

import Link from 'next/link';
import { useCan } from '@/components/auth/current-user-provider';
import { Icons } from '@/components/icons';
import type { Device } from '../api/types';

/** "Wiring" link in a device row, to the page where that device's board and sensors are designed. */
export function DeviceWiringLink({ device }: { device: Device }) {
  if (!useCan()('devices:write')) return null;
  return (
    <Link
      href={`/dashboard/device-identifiers/${device.id}/wiring`}
      className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
    >
      <Icons.device className='size-4' />
      Wiring
    </Link>
  );
}
