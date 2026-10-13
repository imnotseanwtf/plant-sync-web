'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { plantOverviewQueryOptions } from '../api/queries';
import type { PlantOverview, SensorReading } from '../api/types';

type Tone = 'success' | 'warning' | 'danger';

const toneClass: Record<Tone, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400'
};

// Same optimal ranges the Filament stats widget used.
const lightTone = (v: number): Tone => (v > 2000 ? 'danger' : v < 1000 ? 'warning' : 'success');
const humidityTone = (v: number): Tone => (v > 80 ? 'danger' : v < 60 ? 'warning' : 'success');

function StatCard({
  title,
  value,
  description,
  tone
}: {
  title: string;
  value: string;
  description: string;
  tone?: Tone;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums ${tone ? toneClass[tone] : ''}`}>
          {value}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/** Sensor values arrive as raw doubles (e.g. 24.840373983461856); show one decimal at most. */
const fmt = (n: number) => String(Math.round(n * 10) / 10);

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

function ReadingChart({
  title,
  unit,
  dataKey,
  color,
  data,
  domain
}: {
  title: string;
  unit: string;
  dataKey: 'moisture' | 'temperature';
  color: string;
  data: { time: string; moisture: number; temperature: number }[];
  domain?: [number, number];
}) {
  const config = { [dataKey]: { label: title, color } } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Last {data.length} readings, refreshed every 5 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>No readings yet.</p>
        ) : (
          <ChartContainer config={config} className='h-[260px] w-full'>
            <AreaChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='time'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                domain={domain ?? ['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                width={44}
                unit={unit}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area
                dataKey={dataKey}
                type='monotone'
                stroke={`var(--color-${dataKey})`}
                fill={`var(--color-${dataKey})`}
                fillOpacity={0.2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ReadingsTable({ readings }: { readings: SensorReading[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest readings</CardTitle>
        <CardDescription>Most recent {readings.length} sensor readings</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Moisture</TableHead>
              <TableHead>Humidity</TableHead>
              <TableHead>Temperature</TableHead>
              <TableHead>Light</TableHead>
              <TableHead>Irrigating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-muted-foreground h-24 text-center'>
                  No readings yet. They appear here as soon as the device reports.
                </TableCell>
              </TableRow>
            ) : (
              readings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <time dateTime={r.createdAt} suppressHydrationWarning>
                      {new Date(r.createdAt).toLocaleString()}
                    </time>
                  </TableCell>
                  <TableCell>{fmt(r.moistureLevel)}%</TableCell>
                  <TableCell>{fmt(r.humidity)}%</TableCell>
                  <TableCell>{fmt(r.temperature)}°C</TableCell>
                  <TableCell>{fmt(r.lightIntensity)} lux</TableCell>
                  <TableCell>
                    {r.isIrrigating ? (
                      <Badge>
                        <Icons.droplet /> Yes
                      </Badge>
                    ) : (
                      <span className='text-muted-foreground'>No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function PlantDashboard({
  plantId,
  initialData
}: {
  plantId: number;
  initialData: PlantOverview;
}) {
  const { data } = useQuery({ ...plantOverviewQueryOptions(plantId), initialData });

  if (!data) {
    return <p className='text-muted-foreground py-12 text-center'>This plant no longer exists.</p>;
  }

  const { plant, latest, irrigatedToday, readings } = data;
  const chartData = readings
    .slice(0, 10)
    .toReversed()
    .map((r) => ({
      time: timeLabel(r.createdAt),
      moisture: r.moistureLevel,
      temperature: r.temperature
    }));

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <Badge variant='outline'>Device: {plant.deviceName}</Badge>
        {latest?.isIrrigating && (
          <Badge>
            <Icons.droplet /> Irrigating now
          </Badge>
        )}
        {latest && latest.moistureLevel <= plant.moistureLevelMin && !latest.isIrrigating && (
          <Badge variant='secondary'>Needs water</Badge>
        )}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Irrigated today'
          value={String(irrigatedToday)}
          description='Readings taken while the pump was on (UTC day)'
          tone='success'
        />
        <StatCard
          title='Soil moisture'
          value={latest ? `${fmt(latest.moistureLevel)}%` : 'No Data'}
          description={`Target range: ${plant.moistureLevelMin}–${plant.moistureLevelMax}%`}
          tone={
            latest
              ? latest.moistureLevel <= plant.moistureLevelMin
                ? 'warning'
                : 'success'
              : undefined
          }
        />
        <StatCard
          title='Light intensity'
          value={latest ? `${fmt(latest.lightIntensity)} lux` : 'No Data'}
          description='Optimal range: 1000–2000 lux'
          tone={latest ? lightTone(latest.lightIntensity) : undefined}
        />
        <StatCard
          title='Humidity'
          value={latest ? `${fmt(latest.humidity)}%` : 'No Data'}
          description='Optimal range: 60–80%'
          tone={latest ? humidityTone(latest.humidity) : undefined}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <ReadingChart
          title='Soil moisture'
          unit='%'
          dataKey='moisture'
          color='var(--chart-1)'
          data={chartData}
          domain={[0, 100]}
        />
        <ReadingChart
          title='Temperature'
          unit='°C'
          dataKey='temperature'
          color='var(--chart-2)'
          data={chartData}
        />
      </div>

      <ReadingsTable readings={readings} />
    </div>
  );
}
