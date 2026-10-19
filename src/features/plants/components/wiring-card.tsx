'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { deriveHealth, type PartState } from '@/lib/sensor-health';
import type { PlantOverview } from '../api/types';

// Wiring from the NodeMCU v1.0 diagram, drawn live: working parts pulse and their data wires
// flow; a part that returned no value (null) turns red and is marked "Needs check / repair".

const round = (n: number) => Math.round(n * 10) / 10;

const LEFT_PINS: [string, boolean][] = [
  ['A0', true],
  ['RSV', false],
  ['RSV', false],
  ['SD3', false],
  ['SD2', false],
  ['SD1', false],
  ['CMD', false],
  ['SD0', false],
  ['CLK', false],
  ['GND', true],
  ['3V3', true],
  ['EN', false],
  ['RST', false],
  ['GND', false],
  ['VIN', true]
];
const RIGHT_PINS: [string | null, string, boolean][] = [
  ['GPIO16', 'D0', false],
  ['GPIO5', 'D1', true],
  ['GPIO4', 'D2', true],
  ['GPIO0', 'D3', false],
  ['GPIO2', 'D4', false],
  [null, '3V3', true],
  [null, 'GND', true],
  ['GPIO14', 'D5', true],
  ['GPIO12', 'D6', true],
  ['GPIO13', 'D7', false],
  ['GPIO15', 'D8', false],
  ['GPIO3', 'RX', false],
  ['GPIO1', 'TX', false],
  [null, 'GND', false],
  [null, '3V3', false]
];

type Wire = {
  d: string;
  /** Stroke color of the wire when healthy. */
  color: string;
  /** Power wires stay solid; signal wires carry data and animate. */
  kind: 'power' | 'signal';
  owner: 'board' | 'soil' | 'light' | 'dht' | 'relay' | 'pump';
  /** Runs against the drawing direction (data travelling to the board). */
  reverse?: boolean;
};

const WIRES: Wire[] = [
  { d: 'M120 126 H140 V168 H150', color: '#7a8580', kind: 'power', owner: 'soil' },
  { d: 'M120 138 H132 V188 H150', color: '#7a8580', kind: 'power', owner: 'soil' },
  { d: 'M300 160 H412', color: '#c9930b', kind: 'signal', owner: 'soil' },
  { d: 'M300 208 H360 V376 H412', color: '#7a8580', kind: 'power', owner: 'soil' },
  { d: 'M300 232 H340 V400 H412', color: '#d23b2f', kind: 'power', owner: 'soil' },
  { d: 'M760 136 H620 V280', color: '#d23b2f', kind: 'power', owner: 'light' },
  { d: 'M568 280 H760', color: '#d23b2f', kind: 'power', owner: 'dht' },
  { d: 'M760 160 H640 V400 H760', color: '#7a8580', kind: 'power', owner: 'light' },
  { d: 'M568 304 H760', color: '#7a8580', kind: 'power', owner: 'dht' },
  { d: 'M568 184 H760', color: '#2f6fd6', kind: 'signal', owner: 'light', reverse: true },
  { d: 'M568 208 H760', color: '#1f9d55', kind: 'signal', owner: 'light', reverse: true },
  { d: 'M568 328 H760', color: '#8a4fd1', kind: 'signal', owner: 'dht', reverse: true },
  { d: 'M568 352 H700 V376 H760', color: '#0f8a8a', kind: 'signal', owner: 'relay' },
  { d: 'M412 496 H380 V610 H730 V424 H760', color: '#e07a12', kind: 'power', owner: 'relay' },
  { d: 'M910 376 H960', color: '#3b82f6', kind: 'signal', owner: 'pump' },
  { d: 'M910 416 H940 V470 H960', color: '#3b82f6', kind: 'signal', owner: 'pump' },
  { d: 'M1080 396 H1098 V494 H1080', color: '#3b82f6', kind: 'signal', owner: 'pump' }
];

const STATE_LABEL: Record<PartState, string> = {
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

const LED: Record<PartState, string> = {
  ok: 'fill-emerald-500',
  fault: 'fill-red-500',
  waiting: 'fill-muted-foreground/50',
  offline: 'fill-muted-foreground/50'
};

/** A component box: outline turns red and pulses on a fault; the status LED sits top-right. */
function Box({
  x,
  y,
  w,
  h,
  state
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  state: PartState;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        className={cn(
          'stroke-[1.5] drop-shadow-sm',
          state === 'fault' &&
            'animate-pulse fill-red-50 stroke-red-500 stroke-2 dark:fill-red-950/50',
          state === 'ok' && 'fill-emerald-50 stroke-emerald-500/60 dark:fill-emerald-950/40',
          (state === 'waiting' || state === 'offline') && 'fill-card stroke-border'
        )}
      />
      <circle
        cx={x + w / 2}
        cy={y + 12}
        r={4.5}
        className={cn(LED[state], state === 'ok' && 'animate-pulse')}
      />
    </>
  );
}

function Pin({ x, y }: { x: number; y: number }) {
  return <rect x={x - 4} y={y - 4} width={8} height={8} className='fill-[#c9a24a]' />;
}

/** Red call-out under or beside a part whose sensor returned nothing. */
function FaultTag({ x, y }: { x: number; y: number }) {
  return (
    <g className='drop-shadow-sm'>
      <rect x={x} y={y} width={176} height={42} rx={8} className='fill-card stroke-red-500/50' />
      <rect x={x} y={y} width={5} height={42} rx={2.5} className='fill-red-500' />
      <path
        d={`M${x + 22} ${y + 11} l9 16 h-18 z`}
        className='fill-red-500'
        strokeLinejoin='round'
      />
      <rect x={x + 21} y={y + 16} width={2} height={6} className='fill-card' />
      <rect x={x + 21} y={y + 24} width={2} height={2} className='fill-card' />
      <text
        x={x + 42}
        y={y + 19}
        className='fill-red-600 dark:fill-red-400 font-sans text-[12px] font-semibold'
      >
        Needs check / repair
      </text>
      <text x={x + 42} y={y + 33} className='fill-muted-foreground font-sans text-[10.5px]'>
        No response from sensor
      </text>
    </g>
  );
}

function wireClass(w: Wire, state: Record<Wire['owner'], PartState>, pumping: boolean) {
  const owner = state[w.owner];
  const dead = owner === 'offline' || owner === 'waiting';
  if (owner === 'fault' && w.kind === 'signal') return 'stroke-red-500 [stroke-dasharray:4_6]';
  if (dead) return 'opacity-30';
  if (w.owner === 'pump' || w.owner === 'relay') {
    if (w.kind === 'signal' && !pumping) return 'opacity-40';
    return w.kind === 'signal' ? cn('wire-flow', w.reverse && '[animation-direction:reverse]') : '';
  }
  return w.kind === 'signal' ? cn('wire-flow', w.reverse && '[animation-direction:reverse]') : '';
}

export function WiringCard({
  latest,
  deviceName,
  now
}: {
  latest: PlantOverview['latest'];
  deviceName: string;
  now: number | null;
}) {
  const health = deriveHealth(latest, now);
  const boardState: PartState =
    health.board === 'online' ? 'ok' : health.board === 'waiting' ? 'waiting' : 'offline';
  const states = {
    board: boardState,
    soil: health.soil,
    light: health.light,
    dht: health.dht,
    relay: boardState,
    pump: boardState
  } satisfies Record<Wire['owner'], PartState>;

  const seconds =
    latest && now
      ? Math.max(0, Math.round((now - new Date(latest.createdAt).getTime()) / 1000))
      : null;
  const lastSeen =
    seconds === null
      ? null
      : seconds < 60
        ? `${seconds}s ago`
        : seconds < 3600
          ? `${Math.floor(seconds / 60)}m ago`
          : `${Math.floor(seconds / 3600)}h ago`;

  const parts: { key: 'soil' | 'light' | 'dht'; name: string; pins: string; value: string }[] = [
    {
      key: 'soil',
      name: 'Soil moisture sensor',
      pins: 'A0',
      value: latest?.moistureLevel != null ? `${round(latest.moistureLevel)}%` : '—'
    },
    {
      key: 'light',
      name: 'BH1750 light sensor',
      pins: 'D1 · D2',
      value: latest?.lightIntensity != null ? `${round(latest.lightIntensity)} lux` : '—'
    },
    {
      key: 'dht',
      name: 'DHT22 temperature & humidity',
      pins: 'D5',
      value:
        latest?.temperature != null && latest?.humidity != null
          ? `${round(latest.temperature)}°C · ${round(latest.humidity)}%`
          : '—'
    }
  ];

  const online = health.board === 'online';
  const tiles = [
    {
      name: 'Soil moisture',
      icon: Icons.droplet,
      state: health.soil,
      value: parts[0].value,
      status: STATE_LABEL[health.soil]
    },
    {
      name: 'Light (BH1750)',
      icon: Icons.sun,
      state: health.light,
      value: parts[1].value,
      status: STATE_LABEL[health.light]
    },
    {
      name: 'Temp & humidity (DHT22)',
      icon: Icons.temperature,
      state: health.dht,
      value: parts[2].value,
      status: STATE_LABEL[health.dht]
    },
    {
      name: 'Irrigation pump',
      icon: Icons.plant,
      state: (online ? (health.irrigating ? 'ok' : 'waiting') : boardState) as PartState,
      value: online ? (health.irrigating ? 'Running' : 'Idle') : '—',
      status: online
        ? health.irrigating
          ? 'Watering now'
          : 'Standing by'
        : STATE_LABEL[boardState]
    }
  ];

  const summary = health.faults.length
    ? `${health.faults.join(', ')} not responding.`
    : health.board === 'online'
      ? 'All sensors responding.'
      : health.board === 'offline'
        ? 'Device is offline.'
        : 'Waiting for the first reading.';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          Device wiring
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
              health.faults.length > 0
                ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                : health.board === 'online'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full',
                health.faults.length > 0
                  ? 'bg-red-500'
                  : health.board === 'online'
                    ? 'animate-pulse bg-emerald-500'
                    : 'bg-muted-foreground/50'
              )}
            />
            {health.faults.length > 0
              ? 'Needs attention'
              : health.board === 'online'
                ? 'All sensors responding'
                : health.board === 'offline'
                  ? 'Offline'
                  : 'Waiting for data'}
          </span>
        </CardTitle>
        <CardDescription className='flex flex-wrap items-center gap-x-3'>
          <span className='font-mono'>{deviceName}</span>
          {lastSeen && (
            <span className='inline-flex items-center gap-1'>
              <Icons.clock className='size-3.5' /> last reading {lastSeen}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
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

        <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {tiles.map((t) => (
            <li
              key={t.name}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3.5',
                t.state === 'fault' && 'border-red-500/40 bg-red-500/5'
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  t.state === 'ok' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  t.state === 'fault' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  (t.state === 'waiting' || t.state === 'offline') &&
                    'bg-muted text-muted-foreground'
                )}
              >
                <t.icon className='size-5' />
              </span>
              <div className='min-w-0'>
                <p className='text-muted-foreground truncate text-xs'>{t.name}</p>
                <p className='text-lg leading-tight font-semibold tabular-nums'>{t.value}</p>
                <p
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium',
                    t.state === 'fault' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', DOT[t.state])} />
                  {t.status}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className='overflow-x-auto'>
          <svg
            viewBox='20 84 1100 556'
            role='img'
            aria-labelledby='wiring-title'
            className='h-auto w-full min-w-[880px]'
          >
            <defs>
              <linearGradient id='pcb' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' className='[stop-color:#2a5a4d] dark:[stop-color:#215a4f]' />
                <stop offset='100%' className='[stop-color:#1b3a33] dark:[stop-color:#173f38]' />
              </linearGradient>
            </defs>
            <title id='wiring-title'>{`Wiring of soil sensor, BH1750, DHT22 and relay to a NodeMCU. ${summary}`}</title>

            <g fill='none' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round'>
              {WIRES.map((w) => (
                <path
                  key={w.d}
                  d={w.d}
                  stroke={w.color}
                  className={wireClass(w, states, health.irrigating)}
                />
              ))}
            </g>
            <circle cx={620} cy={280} r={5} className='fill-foreground' />
            <circle cx={640} cy={304} r={5} className='fill-foreground' />

            {/* NodeMCU board */}
            <rect
              x={400}
              y={96}
              width={180}
              height={462}
              rx={10}
              className='drop-shadow-md'
              fill='url(#pcb)'
            />
            <rect
              x={436}
              y={104}
              width={108}
              height={40}
              rx={3}
              className='fill-[#b9c2c0] dark:fill-[#7d8886]'
            />
            <text
              x={490}
              y={129}
              textAnchor='middle'
              className='fill-[#1d2421] font-mono text-[12px] font-semibold'
            >
              ESP-12E
            </text>
            <rect
              x={466}
              y={544}
              width={48}
              height={26}
              rx={3}
              className='fill-[#b9c2c0] dark:fill-[#7d8886]'
            />
            <text
              x={490}
              y={561}
              textAnchor='middle'
              className='fill-[#1d2421] font-mono text-[10px] font-semibold'
            >
              USB
            </text>
            <text
              x={490}
              y={516}
              textAnchor='middle'
              className='fill-[#dfeae5] font-sans text-[12px] font-semibold'
            >
              NodeMCU v1.0
            </text>
            <circle
              cx={564}
              cy={116}
              r={5}
              className={cn(LED[states.board], states.board === 'ok' && 'animate-pulse')}
            />
            {LEFT_PINS.map(([label, used], i) => (
              <g key={`l${i}`}>
                <circle
                  cx={412}
                  cy={160 + i * 24}
                  r={5}
                  className={cn(
                    'stroke-[#c9a24a] stroke-2',
                    used ? 'fill-[#c9a24a]' : 'fill-[#1f3b36] dark:fill-[#1c4a42]'
                  )}
                />
                <text
                  x={424}
                  y={164 + i * 24}
                  className={cn(
                    'font-mono text-[10.5px]',
                    used ? 'fill-[#dfeae5] font-semibold' : 'fill-[#86a39a]'
                  )}
                >
                  {label}
                </text>
              </g>
            ))}
            {RIGHT_PINS.map(([gpio, label, used], i) => (
              <g key={`r${i}`}>
                <circle
                  cx={568}
                  cy={160 + i * 24}
                  r={5}
                  className={cn(
                    'stroke-[#c9a24a] stroke-2',
                    used ? 'fill-[#c9a24a]' : 'fill-[#1f3b36] dark:fill-[#1c4a42]'
                  )}
                />
                <text
                  x={556}
                  y={164 + i * 24}
                  textAnchor='end'
                  className={cn(
                    'font-mono text-[10.5px]',
                    used ? 'fill-[#dfeae5] font-semibold' : 'fill-[#86a39a]'
                  )}
                >
                  {gpio && <tspan className='fill-[#86a39a] text-[9px] font-normal'>{gpio} </tspan>}
                  {label}
                </text>
              </g>
            ))}

            {/* Soil probe + module */}
            <g className='fill-[#c8b25a] dark:fill-[#a8954a]'>
              <rect x={44} y={116} width={76} height={32} rx={3} />
              <path d='M52 148 h22 v120 l-11 14 l-11 -14 z' />
              <path d='M90 148 h22 v120 l-11 14 l-11 -14 z' />
            </g>
            <text
              x={82}
              y={306}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              YL-69 probe
            </text>
            <text
              x={82}
              y={322}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              (goes in the soil)
            </text>
            <Box x={150} y={140} w={150} h={150} state={states.soil} />
            <text
              x={225}
              y={226}
              textAnchor='middle'
              className='fill-foreground font-mono text-[20px] font-semibold'
            >
              {parts[0].value}
            </text>
            <text
              x={225}
              y={264}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              Soil module
            </text>
            <text
              x={225}
              y={279}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              blue board, LM393
            </text>
            <Pin x={150} y={168} />
            <Pin x={150} y={188} />
            <Pin x={300} y={160} />
            <Pin x={300} y={184} />
            <Pin x={300} y={208} />
            <Pin x={300} y={232} />
            {[
              ['+', 160, 172],
              ['−', 160, 192]
            ].map(([t, x, y]) => (
              <text
                key={String(t)}
                x={Number(x)}
                y={Number(y)}
                className='fill-foreground font-mono text-[11px] font-semibold'
              >
                {t}
              </text>
            ))}
            {[
              ['AO', 164],
              ['DO', 188],
              ['GND', 212],
              ['VCC', 236]
            ].map(([t, y]) => (
              <text
                key={String(t)}
                x={290}
                y={Number(y)}
                textAnchor='end'
                className='fill-foreground font-mono text-[11px] font-semibold'
              >
                {t}
              </text>
            ))}
            {states.soil === 'fault' && <FaultTag x={150} y={300} />}

            {/* BH1750 */}
            <Box x={760} y={118} w={150} h={132} state={states.light} />
            <text
              x={902}
              y={162}
              textAnchor='end'
              className='fill-foreground font-mono text-[15px] font-semibold'
            >
              {parts[1].value}
            </text>
            <text
              x={850}
              y={224}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              BH1750
            </text>
            <text
              x={850}
              y={239}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              light sensor, GY-302
            </text>
            {[
              ['VCC', 136],
              ['GND', 160],
              ['SCL', 184],
              ['SDA', 208]
            ].map(([t, y]) => (
              <g key={String(t)}>
                <Pin x={760} y={Number(y)} />
                <text
                  x={770}
                  y={Number(y) + 4}
                  className='fill-foreground font-mono text-[11px] font-semibold'
                >
                  {t}
                </text>
              </g>
            ))}
            {states.light === 'fault' && <FaultTag x={930} y={148} />}

            {/* DHT22 */}
            <Box x={760} y={266} w={150} h={82} state={states.dht} />
            <text
              x={902}
              y={296}
              textAnchor='end'
              className='fill-foreground font-mono text-[13px] font-semibold'
            >
              {parts[2].value}
            </text>
            <text
              x={850}
              y={322}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              DHT22
            </text>
            <text
              x={850}
              y={337}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              temp + humidity
            </text>
            {[
              ['VCC', 280],
              ['GND', 304],
              ['DATA', 328]
            ].map(([t, y]) => (
              <g key={String(t)}>
                <Pin x={760} y={Number(y)} />
                <text
                  x={770}
                  y={Number(y) + 4}
                  className='fill-foreground font-mono text-[11px] font-semibold'
                >
                  {t}
                </text>
              </g>
            ))}
            {states.dht === 'fault' && <FaultTag x={930} y={272} />}

            {/* Relay + pump */}
            <Box x={760} y={362} w={150} h={124} state={states.relay} />
            <text
              x={850}
              y={450}
              textAnchor='middle'
              className='fill-foreground font-mono text-[13px] font-semibold'
            >
              {health.board === 'online' ? (health.irrigating ? 'ON' : 'OFF') : '—'}
            </text>
            <text
              x={850}
              y={466}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              Relay module
            </text>
            <text
              x={850}
              y={480}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              5V, 1 channel
            </text>
            {[
              ['IN', 376],
              ['GND', 400],
              ['VCC', 424]
            ].map(([t, y]) => (
              <g key={String(t)}>
                <Pin x={760} y={Number(y)} />
                <text
                  x={770}
                  y={Number(y) + 4}
                  className='fill-foreground font-mono text-[11px] font-semibold'
                >
                  {t}
                </text>
              </g>
            ))}
            <Pin x={910} y={376} />
            <Pin x={910} y={416} />
            <text
              x={900}
              y={380}
              textAnchor='end'
              className='fill-foreground font-mono text-[11px] font-semibold'
            >
              NO
            </text>
            <text
              x={900}
              y={420}
              textAnchor='end'
              className='fill-foreground font-mono text-[11px] font-semibold'
            >
              COM
            </text>

            <Box
              x={960}
              y={356}
              w={120}
              h={56}
              state={health.irrigating ? 'ok' : states.pump === 'ok' ? 'waiting' : states.pump}
            />
            <text
              x={1020}
              y={382}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              Water pump
            </text>
            <text
              x={1020}
              y={398}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              {health.irrigating ? 'Running' : 'Idle'}
            </text>
            <Pin x={960} y={376} />
            <Pin x={1080} y={396} />
            <rect
              x={960}
              y={452}
              width={120}
              height={60}
              rx={8}
              className='fill-card stroke-border drop-shadow-sm stroke-[1.5]'
            />
            <text
              x={1020}
              y={486}
              textAnchor='middle'
              className='fill-foreground font-sans text-[13px] font-semibold'
            >
              Pump power
            </text>
            <text
              x={1020}
              y={501}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              5–12V adapter
            </text>
            <Pin x={960} y={470} />
            <Pin x={1080} y={494} />

            <text
              x={555}
              y={628}
              textAnchor='middle'
              className='fill-muted-foreground font-sans text-[11px]'
            >
              VIN (5V from USB) runs under the board to the relay
            </text>
          </svg>
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
      </CardContent>
    </Card>
  );
}
