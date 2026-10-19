import type { WiringDesign } from '@/lib/wiring/design';

export type Device = {
  id: string;
  name: string;
  /** The device's saved wiring design; null means the default layout. */
  wiring: WiringDesign | null;
};

export type DeviceMutationPayload = { name: string };

export type DeviceOption = { value: string; label: string };
