export type Device = {
  id: string;
  name: string;
  plantName: string | null;
  lastReadingAt: string | null;
  createdAt: string;
};

export type DeviceFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type DevicesResponse = { devices: Device[]; total: number };

export type DeviceMutationPayload = { name: string };

export type DeviceOption = { value: string; label: string };
