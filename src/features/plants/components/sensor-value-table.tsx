'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { PER_PAGE_OPTIONS } from '@/types/resource';
import type { PlantOverview, SensorReading } from '../api/types';
import { usePlantOverview } from './plant-widgets';

type SortKey = keyof Pick<
  SensorReading,
  'moistureLevel' | 'humidity' | 'temperature' | 'lightIntensity' | 'isIrrigating' | 'createdAt'
>;

const round = (n: number) => Math.round(n * 10) / 10;

/** null means the sensor was not detected or is defective. */
function reading(value: number | null, unit: string) {
  return value === null ? (
    <span className='text-destructive' title='Sensor not detected or defective'>
      No signal
    </span>
  ) : (
    `${round(value)}${unit}`
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Filament's dateTime format `M j, Y H:i:s`, e.g. `Oct 13, 2026 02:25:50`. */
function timestamp(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const columns: { key: SortKey; label: string; cell: (r: SensorReading) => React.ReactNode }[] = [
  { key: 'moistureLevel', label: 'Moisture Level', cell: (r) => reading(r.moistureLevel, '%') },
  { key: 'humidity', label: 'Humidity', cell: (r) => reading(r.humidity, '%') },
  { key: 'temperature', label: 'Temperature', cell: (r) => reading(r.temperature, '°C') },
  {
    key: 'lightIntensity',
    label: 'Light Intensity',
    cell: (r) => reading(r.lightIntensity, ' lux')
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

type StatusFilter = 'all' | 'irrigating' | 'idle' | 'fault';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All readings' },
  { value: 'irrigating', label: 'Irrigating' },
  { value: 'idle', label: 'Not irrigating' },
  { value: 'fault', label: 'Sensor fault' }
];

const hasFault = (r: SensorReading) =>
  r.moistureLevel === null ||
  r.humidity === null ||
  r.temperature === null ||
  r.lightIntensity === null;

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

  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Search matches the timestamp and the readings as they are shown.
  const term = search.trim().toLowerCase();
  const filtered = readings.filter((r) => {
    if (status === 'irrigating' && !r.isIrrigating) return false;
    if (status === 'idle' && r.isIrrigating) return false;
    if (status === 'fault' && !hasFault(r)) return false;
    if (!term) return true;
    const text = [
      timestamp(r.createdAt),
      ...columns.slice(0, 4).map((c) => {
        const cell = c.cell(r);
        return typeof cell === 'string' ? cell : 'no signal';
      })
    ];
    return text.join(' ').toLowerCase().includes(term);
  });

  const sorted = filtered.toSorted((a, b) => {
    const [x, y] = [a[sort.key], b[sort.key]];
    // Missing readings always sort last.
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    const cmp = x < y ? -1 : x > y ? 1 : 0;
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const pageCount = Math.max(Math.ceil(sorted.length / perPage), 1);
  const currentPage = Math.min(page, pageCount);
  const rows = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);
  const from = sorted.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, sorted.length);

  function toggle(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  }

  return (
    <Card className='overflow-hidden p-0'>
      <div className='flex flex-wrap items-center justify-end gap-2 p-3'>
        <Select
          items={STATUS_OPTIONS}
          value={status}
          onValueChange={(v) => {
            setStatus((v as StatusFilter) ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger aria-label='Filter readings' className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className='relative w-full max-w-64'>
          <Icons.search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder='Search readings'
            aria-label='Search readings'
            className='pl-9'
          />
        </div>
      </div>
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
                {readings.length === 0
                  ? 'No sensor readings yet'
                  : 'No readings match your filters'}
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
      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-sm'>
        <span>
          {sorted.length <= 1
            ? `Showing ${sorted.length} result${sorted.length === 1 ? '' : 's'}`
            : `Showing ${from} to ${to} of ${sorted.length} results`}
        </span>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>Per page</span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => {
              setPerPage(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className='w-20' aria-label='Per page'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pageCount > 1 ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className='text-muted-foreground px-2'>
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        ) : (
          <span />
        )}
      </div>
    </Card>
  );
}
