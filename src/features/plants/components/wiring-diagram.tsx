'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { DeviceHealth, PartState } from '@/lib/sensor-health';
import type { WiringDesign } from '@/lib/wiring/design';
import { layoutDesign, TAG, type PartLayout, type WireLayout } from '@/lib/wiring/layout';
import { SENSORS, type SensorType } from '@/lib/wiring/sensors';

const LED: Record<PartState, string> = {
  ok: 'fill-emerald-500',
  fault: 'fill-red-500',
  waiting: 'fill-muted-foreground/50',
  offline: 'fill-muted-foreground/50'
};

const GOLD = 'fill-[#c9a24a]';

/** A component box: tinted by state, pulsing red on a fault, with the status LED at the top. */
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
  return <rect x={x - 4} y={y - 4} width={8} height={8} className={GOLD} />;
}

/** Red call-out under a part whose sensor returned nothing. */
function FaultTag({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g className='drop-shadow-sm'>
      <rect
        x={x}
        y={y}
        width={w}
        height={TAG.height}
        rx={8}
        className='fill-card stroke-red-500/50'
      />
      <rect x={x} y={y} width={5} height={TAG.height} rx={2.5} className='fill-red-500' />
      <path
        d={`M${x + 20} ${y + 11} l8 14 h-16 z`}
        className='fill-red-500'
        strokeLinejoin='round'
      />
      <rect x={x + 19.2} y={y + 15} width={1.6} height={5} className='fill-card' />
      <rect x={x + 19.2} y={y + 21.5} width={1.6} height={1.8} className='fill-card' />
      <text
        x={x + 32}
        y={y + 18}
        className='fill-red-600 font-sans text-[10.5px] font-semibold dark:fill-red-400'
      >
        Needs check / repair
      </text>
      <text x={x + 32} y={y + 32} className='fill-muted-foreground font-sans text-[10.5px]'>
        No response
      </text>
    </g>
  );
}

function wireClass(w: WireLayout, health: DeviceHealth) {
  const owner = w.owner === 'pump' ? 'relay' : w.owner;
  const state = health.parts[owner] ?? 'waiting';
  const flow = cn('wire-flow', w.reverse && '[animation-direction:reverse]');
  if (state === 'fault' && w.kind === 'signal') return 'stroke-red-500 [stroke-dasharray:4_6]';
  if (state === 'offline' || state === 'waiting') return 'opacity-30';
  if (w.kind !== 'signal') return '';
  // The relay's signal and the pump circuit only carry current while it is watering.
  if (owner === 'relay') return health.irrigating ? flow : 'opacity-40';
  return flow;
}

function Part({
  part,
  state,
  value,
  irrigating
}: {
  part: PartLayout;
  state: PartState;
  value?: string;
  irrigating: boolean;
}) {
  const def = SENSORS[part.type];
  const left = part.side === 'left';
  const e = part.extras;
  const valueSize = value && value.length > 9 ? 'text-[13px]' : 'text-[18px]';
  const outward = e ? e.dir : 1;

  return (
    <g>
      <Box x={part.x} y={part.y} w={part.w} h={part.h} state={state} />
      {value && (
        <text
          x={left ? part.x + 14 : part.x + part.w - 14}
          y={part.y + 46}
          textAnchor={left ? 'start' : 'end'}
          className={cn('fill-foreground font-mono font-semibold', valueSize)}
        >
          {value}
        </text>
      )}
      <text
        x={part.x + part.w / 2}
        y={part.y + part.h - 26}
        textAnchor='middle'
        className='fill-foreground font-sans text-[13px] font-semibold'
      >
        {def.title}
      </text>
      <text
        x={part.x + part.w / 2}
        y={part.y + part.h - 11}
        textAnchor='middle'
        className='fill-muted-foreground font-sans text-[10.5px]'
      >
        {def.model}
      </text>
      {part.pins.map((p) => (
        <g key={p.def.name}>
          <Pin x={p.x} y={p.y} />
          <text
            x={left ? p.x - 10 : p.x + 10}
            y={p.y + 4}
            textAnchor={left ? 'end' : 'start'}
            className='fill-foreground font-mono text-[11px] font-semibold'
          >
            {p.def.name}
          </text>
        </g>
      ))}
      {state === 'fault' && <FaultTag x={part.x} y={part.y + part.h + TAG.offset} w={part.w} />}

      {e && (
        <>
          <Pin x={e.no.x} y={e.no.y} />
          <Pin x={e.com.x} y={e.com.y} />
          {[
            ['NO', e.no.y],
            ['COM', e.com.y]
          ].map(([t, y]) => (
            <text
              key={t}
              x={e.no.x - outward * 10}
              y={Number(y) + 4}
              textAnchor={outward === 1 ? 'end' : 'start'}
              className='fill-foreground font-mono text-[11px] font-semibold'
            >
              {t}
            </text>
          ))}
          <Box
            x={e.pump.x}
            y={e.pump.y}
            w={e.pump.w}
            h={e.pump.h}
            state={irrigating ? 'ok' : 'waiting'}
          />
          <text
            x={e.pump.x + e.pump.w / 2}
            y={e.pump.y + 28}
            textAnchor='middle'
            className='fill-foreground font-sans text-[13px] font-semibold'
          >
            Water pump
          </text>
          <text
            x={e.pump.x + e.pump.w / 2}
            y={e.pump.y + 44}
            textAnchor='middle'
            className='fill-muted-foreground font-sans text-[10.5px]'
          >
            {irrigating ? 'Running' : 'Idle'}
          </text>
          <rect
            x={e.power.x}
            y={e.power.y}
            width={e.power.w}
            height={e.power.h}
            rx={8}
            className='fill-card stroke-border stroke-[1.5] drop-shadow-sm'
          />
          <text
            x={e.power.x + e.power.w / 2}
            y={e.power.y + 34}
            textAnchor='middle'
            className='fill-foreground font-sans text-[13px] font-semibold'
          >
            Pump power
          </text>
          <text
            x={e.power.x + e.power.w / 2}
            y={e.power.y + 49}
            textAnchor='middle'
            className='fill-muted-foreground font-sans text-[10.5px]'
          >
            5–12V adapter
          </text>
          <Pin x={e.pump.plus.x} y={e.pump.plus.y} />
          <Pin x={e.pump.minus.x} y={e.pump.minus.y} />
          <Pin x={e.power.plus.x} y={e.power.plus.y} />
          <Pin x={e.power.minus.x} y={e.power.minus.y} />
        </>
      )}
    </g>
  );
}

/** The wiring drawn from a design: board in the middle, parts around it, a wire per pin. */
export function WiringDiagram({
  design,
  health,
  values,
  summary
}: {
  design: WiringDesign;
  health: DeviceHealth;
  /** Live reading shown on each part, e.g. `52.3%`. */
  values: Partial<Record<SensorType, string>>;
  /** Spoken description for assistive tech. */
  summary: string;
}) {
  const uid = useId().replace(/:/g, '');
  const layout = layoutDesign(design);
  if (!layout) return null;
  const { board } = layout;
  const boardLed: PartState =
    health.board === 'online' ? 'ok' : health.board === 'waiting' ? 'waiting' : 'offline';

  return (
    <svg
      viewBox={layout.viewBox.join(' ')}
      role='img'
      aria-labelledby={`${uid}-title`}
      className='h-auto w-full min-w-[880px]'
    >
      <defs>
        <linearGradient id={`${uid}-pcb`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' className='[stop-color:#2a5a4d] dark:[stop-color:#215a4f]' />
          <stop offset='100%' className='[stop-color:#1b3a33] dark:[stop-color:#173f38]' />
        </linearGradient>
      </defs>
      <title id={`${uid}-title`}>{`Wiring of ${board.def.name}. ${summary}`}</title>

      <g fill='none' strokeWidth={3} strokeLinecap='round' strokeLinejoin='round'>
        {layout.wires.map((w) => (
          <path key={w.d} d={w.d} stroke={w.color} className={wireClass(w, health)} />
        ))}
      </g>

      {/* The board */}
      <rect
        x={board.x}
        y={board.y}
        width={board.w}
        height={board.h}
        rx={10}
        fill={`url(#${uid}-pcb)`}
        className='drop-shadow-md'
      />
      <rect
        x={board.x + 36}
        y={board.y + 8}
        width={108}
        height={40}
        rx={3}
        className='fill-[#b9c2c0] dark:fill-[#7d8886]'
      />
      <text
        x={board.x + board.w / 2}
        y={board.y + 32}
        textAnchor='middle'
        className='fill-[#1d2421] font-mono text-[10px] font-semibold'
      >
        {board.def.chip}
      </text>
      <rect
        x={board.x + board.w / 2 - 24}
        y={board.y + board.h - 28}
        width={48}
        height={26}
        rx={3}
        className='fill-[#b9c2c0] dark:fill-[#7d8886]'
      />
      <text
        x={board.x + board.w / 2}
        y={board.y + board.h - 11}
        textAnchor='middle'
        className='fill-[#1d2421] font-mono text-[10px] font-semibold'
      >
        USB
      </text>
      <text
        x={board.x + board.w / 2}
        y={board.y + board.h - 48}
        textAnchor='middle'
        className='fill-[#dfeae5] font-sans text-[12px] font-semibold'
      >
        {board.def.name.split(' (')[0]}
      </text>
      <circle
        cx={board.x + board.w - 16}
        cy={board.y + 18}
        r={5}
        className={cn(LED[boardLed], boardLed === 'ok' && 'animate-pulse')}
      />

      {layout.pins.map(({ pin, x, y, side, used }) => (
        <g key={pin.id}>
          <circle
            cx={x}
            cy={y}
            r={5}
            className={cn(
              'stroke-[#c9a24a] stroke-2',
              used ? GOLD : 'fill-[#1f3b36] dark:fill-[#1c4a42]'
            )}
          />
          <text
            x={side === 'left' ? x + 12 : x - 12}
            y={y + 4}
            textAnchor={side === 'left' ? 'start' : 'end'}
            className={cn(
              'font-mono text-[10.5px]',
              used ? 'fill-[#dfeae5] font-semibold' : 'fill-[#86a39a]'
            )}
          >
            {side === 'right' &&
              pin.gpio !== undefined &&
              pin.label !== `GPIO${pin.gpio}` &&
              pin.kind === 'gpio' && (
                <tspan className='fill-[#86a39a] text-[9px] font-normal'>GPIO{pin.gpio} </tspan>
              )}
            {pin.label}
            {side === 'left' &&
              pin.gpio !== undefined &&
              pin.kind === 'gpio' &&
              pin.label !== `GPIO${pin.gpio}` && (
                <tspan className='fill-[#86a39a] text-[9px] font-normal'> GPIO{pin.gpio}</tspan>
              )}
          </text>
        </g>
      ))}

      {layout.parts.map((part) => (
        <Part
          key={part.type}
          part={part}
          state={health.parts[part.type] ?? 'waiting'}
          value={
            part.type === 'relay'
              ? health.board === 'online'
                ? health.irrigating
                  ? 'ON'
                  : 'OFF'
                : '—'
              : (values[part.type] ?? '—')
          }
          irrigating={health.irrigating}
        />
      ))}
    </svg>
  );
}
