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

export type PlantFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type PlantsResponse = { plants: Plant[]; total: number };

export type PlantMutationPayload = PlantFormValues;

export type SensorReading = {
  id: number;
  moistureLevel: number;
  humidity: number;
  temperature: number;
  lightIntensity: number;
  isIrrigating: boolean;
  createdAt: string;
};

export type PlantOverview = {
  plant: Plant;
  latest: SensorReading | null;
  irrigatedToday: number;
  /** Newest first, at most 30. */
  readings: SensorReading[];
};
