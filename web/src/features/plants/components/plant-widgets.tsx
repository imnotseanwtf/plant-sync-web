'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const series = readings
    .slice(0, 10)
    .toReversed()
    .map((r) => ({
      time: chartTime(r.createdAt),
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
        <Card>
          <CardHeader>
            <CardTitle>Soil Moisture</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={moistureConfig} className='h-[300px] w-full'>
              <AreaChart data={series} margin={{ left: 4, right: 8, bottom: 24 }}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis
                  dataKey='time'
                  angle={-45}
                  textAnchor='end'
                  height={70}
                  tickLine={false}
                  interval={0}
                  fontSize={11}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  label={{
                    value: 'Moisture Level (%)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey='moisture'
                  type='linear'
                  stroke='var(--color-moisture)'
                  strokeWidth={2.5}
                  fill='var(--color-moisture)'
                  fillOpacity={0.25}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={temperatureConfig} className='h-[300px] w-full'>
              <BarChart data={series} margin={{ left: 4, right: 8, bottom: 24 }}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' />
                <XAxis
                  dataKey='time'
                  angle={-45}
                  textAnchor='end'
                  height={70}
                  tickLine={false}
                  interval={0}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  label={{
                    value: 'Temperature (°C)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey='temperature'
                  fill='var(--color-temperature)'
                  radius={3}
                  isAnimationActive={false}
                >
                  <LabelList dataKey='temperature' position='top' fontSize={10} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
