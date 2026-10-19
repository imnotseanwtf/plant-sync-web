// Turns a wiring design into coordinates for the SVG diagram: the board in the middle, parts
// stacked on whichever side their signal pin sits, and one orthogonal wire per connected pin.
import { boardById, boardPins, type Board, type BoardPin } from './boards';
import type { WiringDesign } from './design';
import { SENSORS, type SensorPinDef, type SensorType } from './sensors';

const ROW = 24;
const PIN_TOP = 64;
const BOARD_W = 180;
const BOX_W = 150;
const GAP = 190;
const LANE0 = 18;
const LANE_STEP = 9;
const STACK_GAP = 62;
const TAG_H = 40;

export const FIRST_PIN_Y = 22;
export const TAG = { height: TAG_H, offset: 8 } as const;

export type PinPos = { pin: BoardPin; x: number; y: number; side: 'left' | 'right'; used: boolean };

export type PartPin = { def: SensorPinDef; x: number; y: number; boardPin?: BoardPin };

export type Extras = {
  pump: {
    x: number;
    y: number;
    w: number;
    h: number;
    plus: { x: number; y: number };
    minus: { x: number; y: number };
  };
  power: {
    x: number;
    y: number;
    w: number;
    h: number;
    plus: { x: number; y: number };
    minus: { x: number; y: number };
  };
  /** NO and COM terminals on the relay box. */
  no: { x: number; y: number };
  com: { x: number; y: number };
  dir: 1 | -1;
};

export type PartLayout = {
  type: SensorType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which side of the board the part sits on; its pins face the board. */
  side: 'left' | 'right';
  pins: PartPin[];
  extras?: Extras;
};

export type WireKind = 'power' | 'signal';
export type WireLayout = {
  d: string;
  color: string;
  kind: WireKind;
  owner: SensorType | 'pump';
  /** Data travels towards the board, against the drawing direction. */
  reverse?: boolean;
};

export type Layout = {
  viewBox: [number, number, number, number];
  board: { x: number; y: number; w: number; h: number; def: Board };
  pins: PinPos[];
  parts: PartLayout[];
  wires: WireLayout[];
};

const COLORS = {
  power3v3: '#d23b2f',
  power5v: '#e07a12',
  gnd: '#7a8580',
  analog: '#c9930b',
  scl: '#2f6fd6',
  sda: '#1f9d55',
  dht22: '#8a4fd1',
  relay: '#0f8a8a',
  pump: '#3b82f6'
} as const;

function wireColor(type: SensorType, def: SensorPinDef) {
  if (def.kind === 'i2c') return def.name === 'SCL' ? COLORS.scl : COLORS.sda;
  if (def.kind === 'io') return type === 'relay' ? COLORS.relay : COLORS.dht22;
  return COLORS[def.kind];
}

const isSignal = (def: SensorPinDef) =>
  def.kind === 'analog' || def.kind === 'io' || def.kind === 'i2c';

export function layoutDesign(design: WiringDesign): Layout | null {
  const board = boardById(design.board);
  if (!board) return null;

  const boardX = 40 + BOX_W + GAP;
  const boardY = 100;
  const rows = Math.max(board.left.length, board.right.length);
  const boardH = PIN_TOP + rows * ROW + 78;
  const rightEdge = boardX + BOARD_W;

  const used = new Set(design.sensors.flatMap((s) => Object.values(s.pins)));
  const pinPos = new Map<string, PinPos>();
  for (const { pin, side, row } of boardPins(board)) {
    pinPos.set(pin.id, {
      pin,
      side,
      x: side === 'left' ? boardX + 12 : rightEdge - 12,
      y: boardY + PIN_TOP + row * ROW,
      used: used.has(pin.id)
    });
  }

  // Place parts: left or right by where their first signal pin is printed, stacked top to bottom.
  const columns = { left: boardY + 14, right: boardY + 14 };
  const parts: PartLayout[] = design.sensors.map((sensor) => {
    const def = SENSORS[sensor.type];
    const signal = def.pins.find(isSignal);
    const side = (signal && pinPos.get(sensor.pins[signal.name])?.side) || 'right';
    const h = def.pins.length * ROW + 58;
    const x = side === 'left' ? 40 : rightEdge + GAP;
    const y = columns[side];
    columns[side] = y + h + STACK_GAP;

    const facing = side === 'left' ? x + BOX_W : x;
    const pins: PartPin[] = def.pins.map((p, i) => ({
      def: p,
      x: facing,
      y: y + FIRST_PIN_Y + i * ROW,
      boardPin: pinPos.get(sensor.pins[p.name])?.pin
    }));

    const part: PartLayout = { type: sensor.type, x, y, w: BOX_W, h, side, pins };
    if (sensor.type === 'relay') part.extras = relayExtras(part);
    return part;
  });

  // Wires. Each gap between a column and the board has its own set of vertical lanes, so no two
  // wires share a segment; a wire to the far side of the board goes over the top.
  const lanes = { left: 0, right: 0 };
  let over = 0;
  const laneXs: number[] = [];
  const lane = (side: 'left' | 'right') => {
    const k = lanes[side]++;
    const x =
      side === 'left'
        ? 40 + BOX_W + LANE0 + k * LANE_STEP
        : rightEdge + GAP - LANE0 - k * LANE_STEP;
    laneXs.push(x);
    return x;
  };

  const wires: WireLayout[] = [];
  for (const part of parts) {
    for (const p of part.pins) {
      const target = p.boardPin && pinPos.get(p.boardPin.id);
      if (!target) continue;
      const sx = p.x;
      const first = lane(part.side);
      const d =
        target.side === part.side
          ? `M${sx} ${p.y} H${first} V${target.y} H${target.x}`
          : `M${sx} ${p.y} H${first} V${boardY - 20 - over++ * LANE_STEP} H${lane(target.side)} V${target.y} H${target.x}`;
      wires.push({
        d,
        color: wireColor(part.type, p.def),
        kind: isSignal(p.def) ? 'signal' : 'power',
        owner: part.type,
        reverse: part.side === 'right' && isSignal(p.def)
      });
    }
    if (part.extras) wires.push(...extraWires(part.extras));
  }

  // Bounds, with room for the wires that go over the top and the fault tags under each part.
  const boxes = [
    { x: boardX, y: boardY - 20 - over * LANE_STEP, w: BOARD_W, h: boardH + 20 + over * LANE_STEP },
    ...parts.flatMap((p) => [
      { x: p.x, y: p.y, w: p.w, h: p.h + TAG.offset + TAG_H },
      ...(p.extras ? [p.extras.pump, p.extras.power] : [])
    ])
  ];
  // Wires reach the far side of the board even when no part sits there.
  const minX = Math.min(...boxes.map((b) => b.x), ...laneXs) - 24;
  const minY = Math.min(...boxes.map((b) => b.y)) - 16;
  const maxX = Math.max(...boxes.map((b) => b.x + b.w), ...laneXs) + 24;
  const maxY = Math.max(...boxes.map((b) => b.y + b.h)) + 16;

  return {
    viewBox: [minX, minY, maxX - minX, maxY - minY],
    board: { x: boardX, y: boardY, w: BOARD_W, h: boardH, def: board },
    pins: [...pinPos.values()],
    parts,
    wires
  };
}

/** Water pump and its power supply, hung off the relay's NO and COM terminals on the outer side. */
function relayExtras(part: PartLayout): Extras {
  const dir = part.side === 'right' ? 1 : -1;
  const edge = part.side === 'right' ? part.x + part.w : part.x;
  const noY = part.y + FIRST_PIN_Y;
  const comY = part.y + FIRST_PIN_Y + ROW * 2;
  const w = 120;
  const px = dir === 1 ? edge + 56 : edge - 56 - w;
  const near = dir === 1 ? px : px + w;
  const far = dir === 1 ? px + w : px;
  const pump = { x: px, y: noY - 20, w, h: 56 };
  const power = { x: px, y: pump.y + pump.h + 24, w, h: 60 };
  return {
    dir,
    no: { x: edge, y: noY },
    com: { x: edge, y: comY },
    pump: { ...pump, plus: { x: near, y: noY }, minus: { x: far, y: pump.y + 40 } },
    power: { ...power, plus: { x: near, y: power.y + 16 }, minus: { x: far, y: power.y + 44 } }
  };
}

function extraWires(e: Extras): WireLayout[] {
  const mid = e.no.x + e.dir * 28;
  const back = e.pump.minus.x + e.dir * 18;
  const make = (d: string): WireLayout => ({
    d,
    color: COLORS.pump,
    kind: 'signal',
    owner: 'pump'
  });
  return [
    make(`M${e.no.x} ${e.no.y} H${e.pump.plus.x}`),
    make(`M${e.com.x} ${e.com.y} H${mid} V${e.power.plus.y} H${e.power.plus.x}`),
    make(`M${e.pump.minus.x} ${e.pump.minus.y} H${back} V${e.power.minus.y} H${e.power.minus.x}`)
  ];
}
