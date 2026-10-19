export type PlantStatus =
  | 'irrigating'
  | 'needs-water'
  | 'ok'
  | 'no-data'
  | 'offline'
  | 'sensor-fault';

export type MoisturePoint = { t: number; v: number };

export type IrrigationDay = { day: string; count: number };

export type PlantSummary = {
  id: number;
  name: string;
  deviceName: string;
  moisture: number | null;
  moistureMin: number;
  moistureMax: number;
  temperature: number | null;
  humidity: number | null;
  lightIntensity: number | null;
  lastReadingAt: string | null;
  status: PlantStatus;
  /** Moisture averaged into 15-minute buckets over the last 24 hours. */
  history: MoisturePoint[];
};

export type DashboardSummary = {
  plantCount: number;
  deviceCount: number;
  /** Watering cycles started today (UTC day). */
  irrigatedToday: number;
  /** Watering cycles started per UTC day, oldest first, last 14 days. */
  irrigationByDay: IrrigationDay[];
  needsWater: number;
  /** Plants that are out of water, offline or have a faulty sensor. */
  attention: number;
  /** Server clock when the summary was built, ISO. */
  generatedAt: string;
  plants: PlantSummary[];
};
