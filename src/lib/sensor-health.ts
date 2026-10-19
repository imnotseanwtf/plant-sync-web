// Works out which parts of a device are responding from its latest reading. Safe for client code.
import { SENSORS, type SensorType } from '@/lib/wiring/sensors';

/** A device that hasn't reported for this long is shown as offline (it posts every few seconds). */
export const OFFLINE_AFTER_MS = 10 * 60 * 1000;

export type Reading = {
  moistureLevel: number | null;
  humidity: number | null;
  temperature: number | null;
  lightIntensity: number | null;
  isIrrigating: boolean;
  createdAt: string;
};

/** ok: responding · fault: no response, needs check or repair · waiting: nothing received yet · offline: board silent */
export type PartState = 'ok' | 'fault' | 'waiting' | 'offline';

export type BoardState = 'online' | 'waiting' | 'offline';

export type DeviceHealth = {
  board: BoardState;
  /** One entry per part in the device's wiring design. */
  parts: Partial<Record<SensorType, PartState>>;
  irrigating: boolean;
  /** Parts that need a check or repair, for the warning banner. */
  faults: string[];
};

/** The part state implied by the board alone (when it isn't online there is nothing to judge). */
export const boardPartState = (board: BoardState): PartState =>
  board === 'online' ? 'ok' : board === 'waiting' ? 'waiting' : 'offline';

/** `now` is null until the client has mounted, so the first render matches the server's. */
export function deriveHealth(
  latest: Reading | null,
  now: number | null,
  types: readonly SensorType[]
): DeviceHealth {
  const board: BoardState = !latest
    ? 'waiting'
    : now !== null && now - new Date(latest.createdAt).getTime() > OFFLINE_AFTER_MS
      ? 'offline'
      : 'online';

  const parts: DeviceHealth['parts'] = {};
  const faults: string[] = [];
  for (const type of types) {
    if (board !== 'online' || !latest) {
      parts[type] = boardPartState(board);
      continue;
    }
    // A part with no readings of its own (the relay) has nothing to fault on.
    // The DHT22 sends two values over one wire, so a gap in either means it needs a check.
    const missing = SENSORS[type].metrics.some((m) => latest[m] === null);
    parts[type] = missing ? 'fault' : 'ok';
    if (missing) faults.push(SENSORS[type].name);
  }

  return { board, parts, irrigating: board === 'online' && !!latest?.isIrrigating, faults };
}
