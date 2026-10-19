// A device's wiring: which board it uses and which board pin each sensor pin goes to.
import * as z from 'zod';
import { boardById, boardPins, BOARDS, DEFAULT_BOARD_ID, type Board } from './boards';
import { isShareable, pinFits, SENSOR_TYPES, SENSORS, type SensorType } from './sensors';

export type WiringSensor = {
  type: SensorType;
  /** sensor pin name → board pin id */ pins: Record<string, string>;
};
export type WiringDesign = { board: string; sensors: WiringSensor[] };

export const wiringSchema = z.object({
  board: z.string(),
  sensors: z
    .array(z.object({ type: z.enum(SENSOR_TYPES), pins: z.record(z.string(), z.string()) }))
    .max(SENSOR_TYPES.length)
});

/** The wiring the firmware in this repo expects, per board. */
const PRESETS: Record<string, Record<SensorType, Record<string, string>>> = {
  'nodemcu-v1': {
    soil: { VCC: '3V3', GND: 'GND.1', AO: 'A0' },
    bh1750: { VCC: '3V3.2', GND: 'GND.3', SCL: 'D1', SDA: 'D2' },
    dht22: { VCC: '3V3.2', GND: 'GND.3', DATA: 'D5' },
    relay: { VCC: 'VIN', GND: 'GND.3', IN: 'D6' }
  },
  'esp32-devkit': {
    soil: { VCC: '3V3', GND: 'GND.1', AO: 'D34' },
    bh1750: { VCC: '3V3', GND: 'GND.2', SCL: 'D22', SDA: 'D21' },
    dht22: { VCC: '3V3', GND: 'GND.1', DATA: 'D25' },
    relay: { VCC: 'VIN', GND: 'GND.1', IN: 'D14' }
  }
};

export function defaultDesign(boardId: string = DEFAULT_BOARD_ID): WiringDesign {
  const preset = PRESETS[boardId] ?? PRESETS[DEFAULT_BOARD_ID];
  return {
    board: boardById(boardId) ? boardId : DEFAULT_BOARD_ID,
    sensors: SENSOR_TYPES.map((type) => ({ type, pins: { ...preset[type] } }))
  };
}

/** Pin assignment for one sensor on a board: the preset where it is free, else the first pin that fits. */
export function autoPins(
  board: Board,
  type: SensorType,
  taken: Set<string>
): Record<string, string> {
  const preset = PRESETS[board.id]?.[type] ?? {};
  const all = boardPins(board).map((p) => p.pin);
  const pins: Record<string, string> = {};
  for (const def of SENSORS[type].pins) {
    const preferred = all.find((p) => p.id === preset[def.name]);
    const free = (id: string) => isShareable(def.kind) || !taken.has(id);
    const pick =
      preferred && pinFits(def.kind, preferred) && free(preferred.id)
        ? preferred
        : all.find((p) => pinFits(def.kind, p) && free(p.id));
    if (pick) {
      pins[def.name] = pick.id;
      if (!isShareable(def.kind)) taken.add(pick.id);
    }
  }
  return pins;
}

/** Switch boards, keeping the same sensors and re-picking their pins for the new board. */
export function retargetBoard(design: WiringDesign, boardId: string): WiringDesign {
  const board = boardById(boardId);
  if (!board) return design;
  const taken = new Set<string>();
  return {
    board: boardId,
    sensors: design.sensors.map((s) => ({ type: s.type, pins: autoPins(board, s.type, taken) }))
  };
}

export function addSensor(design: WiringDesign, type: SensorType): WiringDesign {
  const board = boardById(design.board);
  if (!board || design.sensors.some((s) => s.type === type)) return design;
  const taken = new Set(
    design.sensors.flatMap((s) =>
      SENSORS[s.type].pins.filter((p) => !isShareable(p.kind)).map((p) => s.pins[p.name])
    )
  );
  const sensors = [...design.sensors, { type, pins: autoPins(board, type, taken) }].toSorted(
    (a, b) => SENSOR_TYPES.indexOf(a.type) - SENSOR_TYPES.indexOf(b.type)
  );
  return { ...design, sensors };
}

/** Everything wrong with a design, in plain words; empty when it is wireable. */
export function designErrors(design: WiringDesign): string[] {
  const board = boardById(design.board);
  if (!board) return ['Pick a board.'];
  const byId = new Map(boardPins(board).map((p) => [p.pin.id, p.pin]));
  const errors: string[] = [];
  const types = new Set<SensorType>();
  const signalOwners = new Map<string, string>();

  for (const sensor of design.sensors) {
    const def = SENSORS[sensor.type];
    if (types.has(sensor.type)) errors.push(`${def.name} is added twice.`);
    types.add(sensor.type);

    for (const pinDef of def.pins) {
      const where = `${def.title} ${pinDef.name}`;
      const id = sensor.pins[pinDef.name];
      const pin = id ? byId.get(id) : undefined;
      if (!pin) {
        errors.push(`${where}: pick a pin.`);
        continue;
      }
      if (!pinFits(pinDef.kind, pin)) errors.push(`${where}: ${pin.label} can't be used for this.`);
      if (!isShareable(pinDef.kind)) {
        const owner = signalOwners.get(pin.id);
        if (owner) errors.push(`${where}: ${pin.label} is already used by ${owner}.`);
        else signalOwners.set(pin.id, where);
      }
    }
  }
  // Two I²C parts may share the bus, but a plain pin can't also carry I²C.
  for (const sensor of design.sensors) {
    for (const pinDef of SENSORS[sensor.type].pins.filter((p) => p.kind === 'i2c')) {
      const id = sensor.pins[pinDef.name];
      const clash = signalOwners.get(id);
      if (clash)
        errors.push(
          `${SENSORS[sensor.type].title} ${pinDef.name}: ${id} is already used by ${clash}.`
        );
    }
  }
  return errors;
}

/** Saved JSON → a valid design, falling back to the default when missing or broken. */
export function parseDesign(value: unknown): WiringDesign | null {
  const parsed = wiringSchema.safeParse(value);
  if (!parsed.success) return null;
  return designErrors(parsed.data).length === 0 ? parsed.data : null;
}

export const BOARD_OPTIONS = BOARDS.map((b) => ({ value: b.id, label: b.name }));
