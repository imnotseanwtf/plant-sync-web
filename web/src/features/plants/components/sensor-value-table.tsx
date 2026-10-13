'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { PlantOverview, SensorReading } from '../api/types';
import { usePlantOverview } from './plant-widgets';

type SortKey = keyof Pick<
  SensorReading,
  'moistureLevel' | 'humidity' | 'temperature' | 'lightIntensity' | 'isIrrigating' | 'createdAt'
>;

const round = (n: number) => Math.round(n * 10) / 10;

const pad = (n: number) => String(n).padStart(2, '0');

/** Filament's dateTime format `M j, Y H:i:s`, e.g. `Oct 13, 2026 02:25:50`. */
function timestamp(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const columns: { key: SortKey; label: string; cell: (r: SensorReading) => React.ReactNode }[] = [
  { key: 'moistureLevel', label: 'Moisture Level', cell: (r) => `${round(r.moistureLevel)}%` },
  { key: 'humidity', label: 'Humidity', cell: (r) => `${round(r.humidity)}%` },
  { key: 'temperature', label: 'Temperature', cell: (r) => `${round(r.temperature)}°C` },
  {
    key: 'lightIntensity',
    label: 'Light Intensity',
    cell: (r) => `${round(r.lightIntensity)} lux`
  },
  {
    key: 'isIrrigating',
    label: 'Irrigation Status',
    cell: (r) =>
      r.isIrrigating ? (
        <Icons.circleCheck className='size-5 text-green-600' aria-label='Irrigating' />
      ) : (
        <Icons.circleX className='size-5 text-red-600' aria-label='Not irrigating' />
      )
  },
  {
    key: 'createdAt',
    label: 'Timestamp',
    cell: (r) => (
      <time dateTime={r.createdAt} suppressHydrationWarning>
        {timestamp(r.createdAt)}
      </time>
    )
  }
];

/** The Filament SensorValueTable widget: last 30 readings, newest first, sortable, polled every 5s. */
export function SensorValueTable({
  plantId,
  initial
}: {
  plantId: number;
  initial: PlantOverview;
}) {
  const { readings } = usePlantOverview(plantId, initial);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc'
  });

  const rows = readings.toSorted((a, b) => {
    const [x, y] = [a[sort.key], b[sort.key]];
    const cmp = x < y ? -1 : x > y ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  function toggle(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }

  return (
    <Card className='overflow-hidden p-0'>
      <Table>
        <TableHeader className='bg-muted/40'>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className='text-foreground px-6 font-semibold'>
                <button
                  type='button'
                  onClick={() => toggle(c.key)}
                  className='flex items-center gap-1'
                >
                  {c.label}
                  {sort.key === c.key && sort.dir === 'asc' ? (
                    <Icons.chevronUp className='text-primary size-4' />
                  ) : (
                    <Icons.chevronDown
                      className={
                        sort.key === c.key ? 'text-primary size-4' : 'text-muted-foreground size-4'
                      }
                    />
                  )}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className='text-muted-foreground h-24 text-center'
              >
                No sensor readings yet
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                {columns.map((c) => (
                  <TableCell key={c.key} className='px-6'>
                    {c.cell(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
