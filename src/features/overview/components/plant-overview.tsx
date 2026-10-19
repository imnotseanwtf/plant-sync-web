'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewSummaryQueryOptions } from '../api/queries';
import type { PlantStatus, PlantSummary } from '../api/types';
import { MoistureSpark } from './moisture-spark';

const statusBadge: Record<
  PlantStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  irrigating: { label: 'Irrigating', variant: 'default' },
  'needs-water': { label: 'Needs water', variant: 'destructive' },
  ok: { label: 'Healthy', variant: 'secondary' },
  'no-data': { label: 'No data', variant: 'outline' },
  offline: { label: 'Offline', variant: 'outline' },
  'sensor-fault': { label: 'Sensor fault', variant: 'destructive' }
};

/** Ages are measured against the server clock so server and client render the same text. */
function timeAgo(iso: string | null, nowIso: string) {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const round = (n: number) => Math.round(n * 10) / 10;

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

function AttentionStrip({ plants, generatedAt }: { plants: PlantSummary[]; generatedAt: string }) {
  if (plants.length === 0) return null;
  return (
    <Card className='border-destructive/40'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.warning className='text-destructive size-4' />
          Needs attention ({plants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='divide-y'>
          {plants.map((plant) => {
            const badge = statusBadge[plant.status];
            return (
              <li key={plant.id}>
                <Link
                  href={`/dashboard/plants/${plant.id}/edit`}
                  className='hover:bg-muted/50 flex flex-wrap items-center gap-x-3 gap-y-1 rounded px-1 py-2 text-sm'
                >
                  <span className='font-medium'>{plant.name}</span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className='text-muted-foreground tabular-nums'>
                    {plant.moisture === null
                      ? '—'
                      : `${round(plant.moisture)}% (min ${plant.moistureMin}%)`}
                  </span>
                  <span className='text-muted-foreground ml-auto text-xs'>
                    Seen {timeAgo(plant.lastReadingAt, generatedAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function PlantCard({ plant, generatedAt }: { plant: PlantSummary; generatedAt: string }) {
  const badge = statusBadge[plant.status];
  return (
    <Link
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
              {plant.moisture === null ? '—' : `${round(plant.moisture)}%`}
            </span>
            <span className='text-muted-foreground text-xs'>
              Target {plant.moistureMin}–{plant.moistureMax}%
            </span>
          </div>
          <MoistureSpark data={plant.history} />
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
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs tabular-nums'>
            {plant.temperature !== null && (
              <span className='flex items-center gap-1'>
                <Icons.temperature className='size-3' />
                {round(plant.temperature)}°C
              </span>
            )}
            {plant.humidity !== null && (
              <span className='flex items-center gap-1'>
                <Icons.droplet className='size-3' />
                {round(plant.humidity)}%
              </span>
            )}
            {plant.lightIntensity !== null && (
              <span className='flex items-center gap-1'>
                <Icons.sun className='size-3' />
                {Math.round(plant.lightIntensity)} lx
              </span>
            )}
            <span className='ml-auto'>Seen {timeAgo(plant.lastReadingAt, generatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PlantOverview() {
  const { data: summary } = useSuspenseQuery(overviewSummaryQueryOptions());
  const attentionPlants = summary.plants.filter(
    (p) => p.status === 'sensor-fault' || p.status === 'needs-water' || p.status === 'offline'
  );

  return (
    <div className='flex flex-col gap-4'>
      <AttentionStrip plants={attentionPlants} generatedAt={summary.generatedAt} />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <Stat title='Plants' value={summary.plantCount} hint='Being monitored' />
        <Stat title='Devices' value={summary.deviceCount} hint='Registered ESP32 boards' />
        <Stat
          title='Irrigations today'
          value={summary.irrigatedToday}
          hint='Readings with the pump on (UTC day)'
        />
        <Stat
          title='Attention'
          value={summary.attention}
          hint='Needs water, offline or sensor fault'
        />
      </div>

      {summary.plants.length === 0 ? (
        <Card>
          <CardContent className='text-muted-foreground py-12 text-center text-sm'>
            No plants yet. Add a device, then create a plant that uses it.
            <div className='mt-4 flex justify-center gap-2'>
              <Link href='/dashboard/device-identifiers' className='underline underline-offset-4'>
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
          {summary.plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} generatedAt={summary.generatedAt} />
          ))}
        </div>
      )}
    </div>
  );
}
