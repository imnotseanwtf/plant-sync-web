'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import type { MoisturePoint } from '../api/types';

/** Last 24h of moisture as a tiny trend line. */
export function MoistureSpark({ data }: { data: MoisturePoint[] }) {
  if (data.length < 2) {
    return (
      <div className='text-muted-foreground flex h-8 items-center text-xs'>No history yet</div>
    );
  }
  return (
    <div className='h-8' role='img' aria-label='Moisture over the last 24 hours'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={data}>
          <YAxis hide domain={[0, 100]} />
          <Line
            dataKey='v'
            dot={false}
            isAnimationActive={false}
            stroke='#008FFB'
            strokeWidth={1.5}
            type='monotone'
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
