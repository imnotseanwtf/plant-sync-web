'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { toneClass, type Tone } from '@/lib/tone';
import { plantOverviewQueryOptions } from '../api/queries';
import type { PlantOverview } from '../api/types';

// Same thresholds the Filament StatsSensorValue widget used.
const lightTone = (v: number): Tone => (v > 2000 ? 'danger' : v < 1000 ? 'warning' : 'success');
const humidityTone = (v: number): Tone => (v > 80 ? 'danger' : v < 60 ? 'warning' : 'success');

/** Raw sensor doubles (24.840373983461856) shown with at most one decimal. */
const round = (n: number) => Math.round(n * 10) / 10;
const roundOrNull = (n: number | null) => (n === null ? null : round(n));

const FAULT = 'Sensor not detected or defective';
const noValue = (latest: unknown) => (latest ? 'No Signal' : 'No Data');

const pad = (n: number) => String(n).padStart(2, '0');

/** Filament's `M d H:i`, e.g. `Oct 13 02:25`. */
export function chartTime(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Axis label: just the clock time, like the starter's compact charts. */
function shortTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** null: sensor not detected or defective; charts leave a gap. */
type Point = { time: string; full: string; moisture: number | null; temperature: number | null };

/** Change between the last two readings, shown as the trend badge (like the starter's graphs). */
function TrendBadge({ delta, unit }: { delta: number | null; unit: string }) {
  if (delta === null) return null;
  const Icon = delta >= 0 ? Icons.trendingUp : Icons.trendingDown;
  return (
    <Badge variant='outline'>
      <Icon />
      {delta >= 0 ? '+' : ''}
      {round(delta)}
      {unit}
    </Badge>
  );
}

const lastDelta = (values: (number | null)[]) => {
  const [prev, last] = values.slice(-2);
  return values.length >= 2 && prev !== null && last !== null ? last - prev : null;
};

const tooltipLabel = (_: unknown, payload: readonly { payload?: unknown }[]) =>
  (payload?.[0]?.payload as Point | undefined)?.full;

/** Soil moisture: area graph with a gradient fill. */
function MoistureGraph({ data }: { data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Soil Moisture
          <TrendBadge delta={lastDelta(data.map((d) => d.moisture))} unit='%' />
        </CardTitle>
        <CardDescription>Last {data.length} readings, refreshed every 5 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className='text-muted-foreground py-16 text-center text-sm'>No readings yet.</p>
        ) : (
          <ChartContainer config={moistureConfig}>
            <AreaChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis dataKey='time' tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelFormatter={tooltipLabel} />}
              />
              <defs>
                <linearGradient id='moisture-fill' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--color-moisture)' stopOpacity={0.55} />
                  <stop offset='100%' stopColor='var(--color-moisture)' stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                dataKey='moisture'
                type='linear'
                fill='url(#moisture-fill)'
                stroke='var(--color-moisture)'
                strokeWidth={3}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** Temperature: bar graph. */
function TemperatureGraph({ data }: { data: Point[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Temperature
          <TrendBadge delta={lastDelta(data.map((d) => d.temperature))} unit='°C' />
        </CardTitle>
        <CardDescription>Last {data.length} readings, refreshed every 5 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className='text-muted-foreground py-16 text-center text-sm'>No readings yet.</p>
        ) : (
          <ChartContainer config={temperatureConfig}>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis dataKey='time' tickLine={false} tickMargin={10} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator='dashed' labelFormatter={tooltipLabel} />}
              />
              <Bar dataKey='temperature' fill='var(--color-temperature)' radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function usePlantOverview(plantId: number, initialData: PlantOverview) {
  return useQuery({ ...plantOverviewQueryOptions(plantId), initialData }).data ?? initialData;
}

function Stat({
  label,
  value,
  description,
  tone
}: {
  label: string;
  value: string;
  description: string;
  tone: Tone;
}) {
  return (
    <Card>
      <CardHeader className='gap-1'>
        <p className='text-muted-foreground text-sm'>{label}</p>
        <p className='text-3xl font-semibold tabular-nums'>{value}</p>
        <p className={`text-sm ${toneClass[tone]}`}>{description}</p>
      </CardHeader>
    </Card>
  );
}

// Filament's chart colors: ApexCharts blue for moisture, amber for temperature.
const moistureConfig = {
  moisture: { label: 'Soil Moisture', color: '#008FFB' }
} satisfies ChartConfig;
const temperatureConfig = {
  temperature: { label: 'Temperature', color: '#f59e0b' }
} satisfies ChartConfig;

export function PlantWidgets({ plantId, initial }: { plantId: number; initial: PlantOverview }) {
  const { latest, irrigatedToday, readings } = usePlantOverview(plantId, initial);

  // Last 10 readings, oldest first.
  const series: Point[] = readings
    .slice(0, 10)
    .toReversed()
    .map((r) => ({
      time: shortTime(r.createdAt),
      full: chartTime(r.createdAt),
      moisture: roundOrNull(r.moistureLevel),
      temperature: roundOrNull(r.temperature)
    }));

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Stat
          label='Irrigated'
          value={String(irrigatedToday)}
          description='Times this day'
          tone='success'
        />
        <Stat
          label='Light Intensity'
          value={
            latest?.lightIntensity != null ? `${round(latest.lightIntensity)} lux` : noValue(latest)
          }
          description={
            latest && latest.lightIntensity === null ? FAULT : 'Optimal range: 1000-2000 lux'
          }
          tone={
            latest?.lightIntensity != null
              ? lightTone(latest.lightIntensity)
              : latest
                ? 'danger'
                : 'warning'
          }
        />
        <Stat
          label='Humidity'
          value={latest?.humidity != null ? `${round(latest.humidity)}%` : noValue(latest)}
          description={latest && latest.humidity === null ? FAULT : 'Optimal range: 60-80%'}
          tone={
            latest?.humidity != null ? humidityTone(latest.humidity) : latest ? 'danger' : 'warning'
          }
        />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <MoistureGraph data={series} />
        <TemperatureGraph data={series} />
      </div>
    </div>
  );
}
