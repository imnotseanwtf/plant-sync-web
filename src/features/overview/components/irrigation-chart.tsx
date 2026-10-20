'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import type { IrrigationDay } from '../api/types';

const config = {
  count: { label: 'Watering cycles', color: '#008FFB' }
} satisfies ChartConfig;

// Parsed as UTC and formatted as UTC so server and client render the same label.
const shortDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

/** Today versus yesterday, shown as the trend badge like the plant graphs. */
function TrendBadge({ delta }: { delta: number }) {
  const Icon = delta >= 0 ? Icons.trendingUp : Icons.trendingDown;
  return (
    <Badge variant='outline'>
      <Icon />
      {delta >= 0 ? '+' : ''}
      {delta}
    </Badge>
  );
}

/** Watering cycles started per day across all plants. */
export function IrrigationChart({ data }: { data: IrrigationDay[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const [yesterday, today] = data.slice(-2);
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Irrigation History
          {yesterday && today && <TrendBadge delta={today.count - yesterday.count} />}
        </CardTitle>
        <CardDescription>
          {total} watering {total === 1 ? 'cycle' : 'cycles'} in the last {data.length} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className='text-muted-foreground py-16 text-center text-sm'>No irrigation yet.</p>
        ) : (
          <ChartContainer config={config} className='aspect-auto h-56 w-full'>
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
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='dashed'
                    labelFormatter={(label) => shortDay(String(label))}
                  />
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
