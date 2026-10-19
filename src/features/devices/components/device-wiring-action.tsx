'use client';

import { useState } from 'react';
import { useCan } from '@/components/auth/current-user-provider';
import { Icons } from '@/components/icons';
import { WiringEditorSheet } from '@/features/plants/components/wiring-editor';
import { defaultDesign } from '@/lib/wiring/design';
import type { Device } from '../api/types';

/** "Wiring" link in a device row: opens the board and sensor designer for that device. */
export function DeviceWiringAction({ device }: { device: Device }) {
  const canEdit = useCan()('devices:write');
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
      >
        <Icons.device className='size-4' />
        Wiring
      </button>
      <WiringEditorSheet
        deviceId={device.id}
        design={device.wiring ?? defaultDesign()}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
