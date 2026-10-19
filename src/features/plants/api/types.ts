import type { WiringDesign } from '@/lib/wiring/design';
import type { PlantFormValues } from '../schemas/plant';

export type Plant = {
  id: number;
  name: string;
  deviceIdentifierId: string;
  deviceName: string;
  moistureLevelMin: number;
  moistureLevelMax: number;
  humidity: number;
  temperature: number;
  lightIntensity: number;
};

export type PlantMutationPayload = PlantFormValues;

export type SensorReading = {
  id: number;
  /** null: the sensor was not detected or is defective. */
  moistureLevel: number | null;
  humidity: number | null;
  temperature: number | null;
  lightIntensity: number | null;
  isIrrigating: boolean;
  createdAt: string;
};

export type PlantOverview = {
  plant: Plant;
  latest: SensorReading | null;
  irrigatedToday: number;
  /** The device's saved wiring design; null means the default layout. */
  wiring: WiringDesign | null;
  /** Newest first, at most 30. */
  readings: SensorReading[];
};
