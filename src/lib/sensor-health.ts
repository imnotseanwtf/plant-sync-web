// Works out which parts of a device are responding from its latest reading. Safe for client code.

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

export type DeviceHealth = {
  board: 'online' | 'waiting' | 'offline';
  soil: PartState;
  light: PartState;
  dht: PartState;
  irrigating: boolean;
  /** Parts that need a check or repair, for the warning banner. */
  faults: string[];
};

const state = (...values: (number | null)[]): PartState =>
  values.some((v) => v === null) ? 'fault' : 'ok';

/** `now` is null until the client has mounted, so the first render matches the server's. */
export function deriveHealth(latest: Reading | null, now: number | null): DeviceHealth {
  if (!latest) {
    return {
      board: 'waiting',
      soil: 'waiting',
      light: 'waiting',
      dht: 'waiting',
      irrigating: false,
      faults: []
    };
  }
  if (now !== null && now - new Date(latest.createdAt).getTime() > OFFLINE_AFTER_MS) {
    return {
      board: 'offline',
      soil: 'offline',
      light: 'offline',
      dht: 'offline',
      irrigating: false,
      faults: []
    };
  }

  // The DHT22 reports temperature and humidity over one wire, so a gap in either means it needs a check.
  const health = {
    board: 'online' as const,
    soil: state(latest.moistureLevel),
    light: state(latest.lightIntensity),
    dht: state(latest.temperature, latest.humidity),
    irrigating: latest.isIrrigating
  };
  const faults = [
    health.soil === 'fault' && 'Soil moisture sensor',
    health.light === 'fault' && 'BH1750 light sensor',
    health.dht === 'fault' && 'DHT22 temperature & humidity sensor'
  ].filter((f): f is string => !!f);
  return { ...health, faults };
}
