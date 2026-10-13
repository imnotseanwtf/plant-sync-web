import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { DashboardSummary, PlantStatus } from '../api/service';
import { AutoRefresh } from './auto-refresh';

const statusBadge: Record<
  PlantStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  irrigating: { label: 'Irrigating', variant: 'default' },
  'needs-water': { label: 'Needs water', variant: 'destructive' },
  ok: { label: 'Healthy', variant: 'secondary' },
  'no-data': { label: 'No data', variant: 'outline' },
  offline: { label: 'Offline', variant: 'outline' }
};

function Stat({ title, value, hint }: { title: string; value: number; hint: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className='text-3xl font-semibold tabular-nums'>{value}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function PlantOverview({ summary }: { summary: DashboardSummary }) {
  return (
    <div className='flex flex-col gap-4'>
      <AutoRefresh />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Stat title='Plants' value={summary.plantCount} hint='Being monitored' />
        <Stat title='Devices' value={summary.deviceCount} hint='Registered ESP32 boards' />
        <Stat
          title='Irrigations today'
          value={summary.irrigatedToday}
          hint='Readings with the pump on (UTC day)'
        />
        <Stat
          title='Needs water'
          value={summary.needsWater}
          hint='Moisture at or below the minimum'
        />
      </div>

      {summary.plants.length === 0 ? (
        <Card>
          <CardContent className='text-muted-foreground py-12 text-center text-sm'>
            No plants yet. Add a device, then create a plant that uses it.
            <div className='mt-4 flex justify-center gap-2'>
              <Link href='/dashboard/devices' className='underline underline-offset-4'>
                Devices
              </Link>
              <Link href='/dashboard/plants' className='underline underline-offset-4'>
                Plants
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {summary.plants.map((plant) => {
            const badge = statusBadge[plant.status];
            return (
              <Link
                key={plant.id}
                href={`/dashboard/plants/${plant.id}/edit`}
                aria-label={`${plant.name} readings`}
                className='group'
              >
                <Card className='group-hover:border-primary/50 h-full transition-colors'>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <CardTitle className='truncate'>{plant.name}</CardTitle>
                        <CardDescription className='truncate'>{plant.deviceName}</CardDescription>
                      </div>
                      <Badge variant={badge.variant}>
                        {plant.status === 'irrigating' && <Icons.droplet />}
                        {badge.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-col gap-2'>
                    <div className='flex items-baseline justify-between'>
                      <span className='text-2xl font-semibold tabular-nums'>
                        {plant.moisture === null ? '—' : `${Math.round(plant.moisture * 10) / 10}%`}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        Target {plant.moistureMin}–{plant.moistureMax}%
                      </span>
                    </div>
                    <div className='bg-muted relative h-2 overflow-hidden rounded-full'>
                      <div
                        className='bg-primary/25 absolute inset-y-0'
                        style={{
                          left: `${plant.moistureMin}%`,
                          width: `${Math.max(plant.moistureMax - plant.moistureMin, 0)}%`
                        }}
                      />
                      {plant.moisture !== null && (
                        <div
                          className='bg-primary absolute inset-y-0 left-0 rounded-full'
                          style={{ width: `${Math.min(Math.max(plant.moisture, 0), 100)}%` }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
