'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { boardPartState, deriveHealth, type PartState } from '@/lib/sensor-health';
import { boardById, boardPins } from '@/lib/wiring/boards';
import type { WiringDesign } from '@/lib/wiring/design';
import { SENSORS, type SensorType } from '@/lib/wiring/sensors';
import type { PlantOverview } from '../api/types';
import { WiringDiagram } from './wiring-diagram';

const round = (n: number) => Math.round(n * 10) / 10;

const COLLAPSED_KEY = 'device-wiring-collapsed';

/** Collapsed state, remembered in this browser. Starts open so the first render matches the server. */
function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1');
    } catch {
      // Storage can be blocked; the card just starts open.
    }
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1');
      } catch {
        // Not remembered, still toggles.
      }
      return !c;
    });
  return [collapsed, toggle] as const;
}

export const STATE_LABEL: Record<PartState, string> = {
  ok: 'Working',
  fault: 'Needs check / repair',
  waiting: 'Waiting for data',
  offline: 'Device offline'
};

const DOT: Record<PartState, string> = {
  ok: 'bg-emerald-500',
  fault: 'bg-red-500',
  waiting: 'bg-muted-foreground/50',
  offline: 'bg-muted-foreground/50'
};

const TILE_ICON: Record<SensorType, keyof typeof Icons> = {
  soil: 'droplet',
  bh1750: 'sun',
  dht22: 'temperature',
  relay: 'plant'
};

const TILE_NAME: Record<SensorType, string> = {
  soil: 'Soil moisture',
  bh1750: 'Light (BH1750)',
  dht22: 'Temp & humidity (DHT22)',
  relay: 'Irrigation pump'
};

/** The live reading of each part as text, or undefined when the sensor returned nothing. */
function readingText(type: SensorType, latest: NonNullable<PlantOverview['latest']>) {
  switch (type) {
    case 'soil':
      return latest.moistureLevel === null ? undefined : `${round(latest.moistureLevel)}%`;
    case 'bh1750':
      return latest.lightIntensity === null ? undefined : `${round(latest.lightIntensity)} lux`;
    case 'dht22':
      return latest.temperature === null || latest.humidity === null
        ? undefined
        : `${round(latest.temperature)}°C · ${round(latest.humidity)}%`;
    default:
      return undefined;
  }
}

function ago(latest: PlantOverview['latest'], now: number | null) {
  if (!latest || now === null) return null;
  const s = Math.max(0, Math.round((now - new Date(latest.createdAt).getTime()) / 1000));
  return s < 60
    ? `${s}s ago`
    : s < 3600
      ? `${Math.floor(s / 60)}m ago`
      : `${Math.floor(s / 3600)}h ago`;
}

/** The pin-by-pin table: which board pin each sensor pin is wired to. */
function PinTable({ design }: { design: WiringDesign }) {
  const board = boardById(design.board);
  if (!board) return null;
  const byId = new Map(boardPins(board).map((p) => [p.pin.id, p.pin]));
  return (
    <details className='group rounded-xl border'>
      <summary className='flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium'>
        Pin by pin
        <Icons.chevronDown className='text-muted-foreground size-4 transition-transform group-open:rotate-180' />
      </summary>
      <div className='overflow-x-auto px-4 pb-3'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-muted-foreground text-left text-xs uppercase'>
              <th className='py-2 pr-4 font-medium'>Part</th>
              <th className='py-2 pr-4 font-medium'>Part pin</th>
              <th className='py-2 font-medium'>{board.name.split(' (')[0]} pin</th>
            </tr>
          </thead>
          <tbody>
            {design.sensors.flatMap((s) =>
              SENSORS[s.type].pins.map((p, i) => {
                const pin = byId.get(s.pins[p.name]);
                return (
                  <tr key={`${s.type}-${p.name}`} className='border-t'>
                    <td className='py-1.5 pr-4'>{i === 0 ? SENSORS[s.type].title : ''}</td>
                    <td className='py-1.5 pr-4 font-mono text-xs'>{p.name}</td>
                    <td className='py-1.5 font-mono text-xs'>
                      {pin
                        ? `${pin.label}${pin.gpio !== undefined && pin.kind === 'gpio' ? ` (GPIO${pin.gpio})` : ''}`
                        : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function WiringCard({
  latest,
  deviceName,
  design,
  now,
  actions
}: {
  latest: PlantOverview['latest'];
  deviceName: string;
  design: WiringDesign;
  now: number | null;
  /** Rendered in the header, e.g. the "Edit wiring" button. */
  actions?: React.ReactNode;
}) {
  const [collapsed, toggleCollapsed] = useCollapsed();
  const types = design.sensors.map((s) => s.type);
  const health = deriveHealth(latest, now, types);
  const lastSeen = ago(latest, now);

  // Last known readings stay visible when the device is offline; only a null leaves a gap.
  const values: Partial<Record<SensorType, string>> = {};
  if (latest) {
    for (const t of types) {
      const text = readingText(t, latest);
      if (text) values[t] = text;
    }
  }

  const tiles = design.sensors.map((s) => {
    const state = health.parts[s.type] ?? 'waiting';
    if (s.type === 'relay') {
      const online = health.board === 'online';
      return {
        type: s.type,
        state: (online
          ? health.irrigating
            ? 'ok'
            : 'waiting'
          : boardPartState(health.board)) as PartState,
        value: online ? (health.irrigating ? 'Running' : 'Idle') : '—',
        status: online ? (health.irrigating ? 'Watering now' : 'Standing by') : STATE_LABEL[state]
      };
    }
    return { type: s.type, state, value: values[s.type] ?? '—', status: STATE_LABEL[state] };
  });

  const summary = health.faults.length
    ? `${health.faults.join(', ')} not responding.`
    : health.board === 'online'
      ? 'All sensors responding.'
      : health.board === 'offline'
        ? 'Device is offline.'
        : 'Waiting for the first reading.';

  const chip =
    health.faults.length > 0
      ? { text: 'Needs attention', tone: 'fault' as const }
      : health.board === 'online'
        ? { text: 'All sensors responding', tone: 'ok' as const }
        : health.board === 'offline'
          ? { text: 'Offline', tone: 'idle' as const }
          : { text: 'Waiting for data', tone: 'idle' as const };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Device wiring
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
              chip.tone === 'fault' &&
                'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
              chip.tone === 'ok' &&
                'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              chip.tone === 'idle' && 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                chip.tone === 'fault' && 'bg-red-500',
                chip.tone === 'ok' && 'animate-pulse bg-emerald-500',
                chip.tone === 'idle' && 'bg-muted-foreground/50'
              )}
            />
            {chip.text}
          </span>
        </CardTitle>
        <CardDescription className='flex flex-wrap items-center gap-x-3'>
          <span className='font-mono'>{deviceName}</span>
          <span>{boardById(design.board)?.name}</span>
          {lastSeen && (
            <span className='inline-flex items-center gap-1'>
              <Icons.clock className='size-3.5' /> last reading {lastSeen}
            </span>
          )}
        </CardDescription>
        <CardAction className='flex items-center gap-2'>
          {actions}
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-expanded={!collapsed}
            aria-controls='device-wiring-content'
            aria-label={collapsed ? 'Expand device wiring' : 'Collapse device wiring'}
            onClick={toggleCollapsed}
          >
            <Icons.chevronDown
              className={cn('size-4 transition-transform', !collapsed && 'rotate-180')}
            />
          </Button>
        </CardAction>
      </CardHeader>
      {!collapsed && (
        <CardContent id='device-wiring-content' className='flex flex-col gap-4'>
          {health.faults.length > 0 && (
            <Alert variant='destructive'>
              <Icons.warning />
              <AlertTitle>
                {health.faults.length === 1
                  ? 'A sensor needs'
                  : `${health.faults.length} sensors need`}{' '}
                a check or repair
              </AlertTitle>
              <AlertDescription>
                {health.faults.join(', ')} returned no value in the latest reading. Check its wiring
                and power, then replace it if it stays red.
              </AlertDescription>
            </Alert>
          )}

          {tiles.length > 0 && (
            <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {tiles.map((t) => {
                const Icon = Icons[TILE_ICON[t.type]];
                return (
                  <li
                    key={t.type}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3.5',
                      t.state === 'fault' && 'border-red-500/40 bg-red-500/5'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        t.state === 'ok' &&
                          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        t.state === 'fault' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                        (t.state === 'waiting' || t.state === 'offline') &&
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className='size-5' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground truncate text-xs'>{TILE_NAME[t.type]}</p>
                      <p className='text-lg leading-tight font-semibold tabular-nums'>{t.value}</p>
                      <p
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-medium',
                          t.state === 'fault'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', DOT[t.state])} />
                        {t.status}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className='overflow-x-auto'>
            <WiringDiagram design={design} health={health} values={values} summary={summary} />
          </div>

          <div className='text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-xs'>
            <span className='flex items-center gap-1.5'>
              <span className='size-2 rounded-full bg-emerald-500' /> Responding
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='size-2 rounded-full bg-red-500' /> Needs check / repair
            </span>
            <span className='flex items-center gap-1.5'>
              <span className='bg-muted-foreground/50 size-2 rounded-full' /> Offline or waiting
            </span>
            <span>Moving dashes show live data on a wire.</span>
          </div>

          <PinTable design={design} />
        </CardContent>
      )}
    </Card>
  );
}
