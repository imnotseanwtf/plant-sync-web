// Parts a device can be wired with. Client-safe (no server imports).
import type { BoardPin } from './boards';

export const SENSOR_TYPES = ['soil', 'bh1750', 'dht22', 'relay'] as const;
export type SensorType = (typeof SENSOR_TYPES)[number];

export type SensorPinKind = 'power3v3' | 'power5v' | 'gnd' | 'analog' | 'io' | 'i2c';
export type SensorPinDef = { name: string; kind: SensorPinKind };

export type Metric = 'moistureLevel' | 'humidity' | 'temperature' | 'lightIntensity';

export type SensorDef = {
  type: SensorType;
  /** Long name, used in messages. */
  name: string;
  /** Short title drawn on the box. */
  title: string;
  model: string;
  pins: SensorPinDef[];
  /** Readings this part produces; a null one means the part needs a check or repair. */
  metrics: Metric[];
};

export const SENSORS: Record<SensorType, SensorDef> = {
  soil: {
    type: 'soil',
    name: 'Soil moisture sensor',
    title: 'Soil module',
    model: 'YL-69 probe, LM393',
    pins: [
      { name: 'VCC', kind: 'power3v3' },
      { name: 'GND', kind: 'gnd' },
      { name: 'AO', kind: 'analog' }
    ],
    metrics: ['moistureLevel']
  },
  bh1750: {
    type: 'bh1750',
    name: 'BH1750 light sensor',
    title: 'BH1750',
    model: 'light sensor, GY-302',
    pins: [
      { name: 'VCC', kind: 'power3v3' },
      { name: 'GND', kind: 'gnd' },
      { name: 'SCL', kind: 'i2c' },
      { name: 'SDA', kind: 'i2c' }
    ],
    metrics: ['lightIntensity']
  },
  dht22: {
    type: 'dht22',
    name: 'DHT22 temperature & humidity sensor',
    title: 'DHT22',
    model: 'temp + humidity',
    pins: [
      { name: 'VCC', kind: 'power3v3' },
      { name: 'GND', kind: 'gnd' },
      { name: 'DATA', kind: 'io' }
    ],
    metrics: ['temperature', 'humidity']
  },
  relay: {
    type: 'relay',
    name: 'Relay and water pump',
    title: 'Relay module',
    model: '5V, 1 channel',
    pins: [
      { name: 'VCC', kind: 'power5v' },
      { name: 'GND', kind: 'gnd' },
      { name: 'IN', kind: 'io' }
    ],
    metrics: []
  }
};

/** Whether a board pin can carry a sensor pin of this kind. */
export function pinFits(kind: SensorPinKind, pin: BoardPin) {
  switch (kind) {
    case 'power3v3':
      return pin.kind === '3v3';
    case 'power5v':
      return pin.kind === '5v';
    case 'gnd':
      return pin.kind === 'gnd';
    case 'analog':
      return pin.kind === 'gpio' && !!pin.analog;
    case 'io':
    case 'i2c':
      return pin.kind === 'gpio' && !pin.inputOnly;
  }
}

/** Power and ground may be shared between parts; I²C lines only with other I²C parts. */
export const isShareable = (kind: SensorPinKind) =>
  kind === 'power3v3' || kind === 'power5v' || kind === 'gnd' || kind === 'i2c';
