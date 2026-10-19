'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import type { IrrigationDay } from '../api/types';

const config = {
  count: { label: 'Watering cycles', color: 'var(--primary)' }
} satisfies ChartConfig;

// Parsed as UTC and formatted as UTC so server and client render the same label.
const shortDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

/** Watering cycles started per day across all plants. */
export function IrrigationChart({ data }: { data: IrrigationDay[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Irrigation history</CardTitle>
        <CardDescription>
          {total} watering {total === 1 ? 'cycle' : 'cycles'} in the last {data.length} days (UTC)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>
            No irrigation in this period.
          </p>
        ) : (
          <ChartContainer config={config} className='h-48 w-full'>
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis
                dataKey='day'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={shortDay}
                interval='preserveStartEnd'
              />
              <YAxis hide allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent labelFormatter={(label) => shortDay(String(label))} />
                }
              />
              <Bar dataKey='count' fill='var(--color-count)' radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
