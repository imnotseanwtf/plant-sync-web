'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { WiringDesigner } from '@/features/plants/components/wiring-editor';
import { cn } from '@/lib/utils';
import { defaultDesign, designErrors, type WiringDesign } from '@/lib/wiring/design';
import { saveWiringMutation } from '../api/mutations';
import type { Device } from '../api/types';

/** The wiring designer for one device, with its own Save (the device form only holds the name). */
export function DeviceWiringForm({ device }: { device: Device }) {
  const [design, setDesign] = useState<WiringDesign>(device.wiring ?? defaultDesign());
  const save = useMutation(saveWiringMutation);
  const errors = designErrors(design);

  return (
    <div className='flex flex-col gap-4'>
      <Card>
        <CardContent>
          <WiringDesigner design={design} onChange={setDesign} />
        </CardContent>
      </Card>
      <div className='flex justify-end gap-2'>
        <Link
          href='/dashboard/device-identifiers'
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancel
        </Link>
        <LoadingButton
          type='button'
          loading={save.isPending}
          disabled={errors.length > 0}
          onClick={() =>
            save.mutate(
              { id: device.id, design },
              {
                onSuccess: () => toast.success('Wiring saved'),
                onError: (e) => toast.error(e.message)
              }
            )
          }
        >
          Save wiring
        </LoadingButton>
      </div>
    </div>
  );
}
