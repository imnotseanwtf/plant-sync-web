'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCan } from '@/components/auth/current-user-provider';
import { buttonVariants } from '@/components/ui/button';
import { defaultDesign } from '@/lib/wiring/design';
import type { PlantOverview } from '../api/types';
import { usePlantOverview } from './plant-widgets';
import { WiringCard } from './wiring-card';

/** Polls the plant overview (shared cache with the widgets) and ticks a clock for staleness. */
export function DeviceWiring({ plantId, initial }: { plantId: number; initial: PlantOverview }) {
  const { latest, plant, wiring } = usePlantOverview(plantId, initial);
  const canEdit = useCan()('devices:write');
  const design = wiring ?? defaultDesign();

  // `now` stays null until mounted so the first client render matches the server's.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <WiringCard
      latest={latest}
      deviceName={plant.deviceName}
      design={design}
      now={now}
      actions={
        canEdit && (
          <Link
            href='/dashboard/device-identifiers'
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Edit on Device Identifiers
          </Link>
        )
      }
    />
  );
}
