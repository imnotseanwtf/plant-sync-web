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
import { plantOverviewQueryOptions } from '../api/queries';
import type { PlantOverview } from '../api/types';

type Tone = 'success' | 'warning' | 'danger';
const toneClass: Record<Tone, string> = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400'
};

// Same thresholds the Filament StatsSensorValue widget used.
const lightTone = (v: number): Tone => (v > 2000 ? 'danger' : v < 1000 ? 'warning' : 'success');
const humidityTone = (v: number): Tone => (v > 80 ? 'danger' : v < 60 ? 'warning' : 'success');

/** Raw sensor doubles (24.840373983461856) shown with at most one decimal. */
const round = (n: number) => Math.round(n * 10) / 10;

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

type Point = { time: string; full: string; moisture: number; temperature: number };

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

const lastDelta = (values: number[]) =>
  values.length >= 2 ? values[values.length - 1] - values[values.length - 2] : null;

const tooltipLabel = (_: unknown, payload: readonly { payload?: unknown }[]) =>
  (payload?.[0]?.payload as Point | undefined)?.full;

/** The starter's dotted area graph, showing soil moisture. */
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
                <DottedPattern id='moisture-dots' color='var(--color-moisture)' />
              </defs>
              <Area
                dataKey='moisture'
                type='natural'
                fill='url(#moisture-dots)'
                fillOpacity={0.4}
                stroke='var(--color-moisture)'
                strokeWidth={0.8}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** The starter's hatched bar graph, showing temperature. */
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
              <Bar
                dataKey='temperature'
                fill='var(--color-temperature)'
                shape={<HatchedBar />}
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function DottedPattern({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} x='0' y='0' width='7' height='7' patternUnits='userSpaceOnUse'>
      <circle cx='5' cy='5' r='1.5' fill={color} opacity={0.5} />
    </pattern>
  );
}

function HatchedBar(props: React.SVGProps<SVGRectElement>) {
  const { fill, x, y, width, height } = props;
  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke='none'
        fill='url(#hatched-bar)'
      />
      <defs>
        <pattern
          id='hatched-bar'
          x='0'
          y='0'
          width='5'
          height='5'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(-45)'
        >
          <rect width='10' height='10' opacity={0.5} fill={fill} />
          <rect width='1' height='10' fill={fill} />
        </pattern>
      </defs>
    </>
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

const moistureConfig = {
  moisture: { label: 'Soil Moisture', color: 'var(--chart-1)' }
} satisfies ChartConfig;
const temperatureConfig = {
  temperature: { label: 'Temperature', color: 'var(--chart-2)' }
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
      moisture: round(r.moistureLevel),
      temperature: round(r.temperature)
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
          value={latest?.lightIntensity ? `${round(latest.lightIntensity)} lux` : 'No Data'}
          description='Optimal range: 1000-2000 lux'
          tone={latest ? lightTone(latest.lightIntensity) : 'warning'}
        />
        <Stat
          label='Humidity'
          value={latest?.humidity ? `${round(latest.humidity)}%` : 'No Data'}
          description='Optimal range: 60-80%'
          tone={latest ? humidityTone(latest.humidity) : 'warning'}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <MoistureGraph data={series} />
        <TemperatureGraph data={series} />
      </div>
    </div>
  );
}
