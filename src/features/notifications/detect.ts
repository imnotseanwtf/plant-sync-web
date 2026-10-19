import type { DashboardSummary, PlantStatus } from '@/features/overview/api/types';

export type NotificationKind = 'needs-water' | 'offline' | 'sensor-fault' | 'irrigating';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  plantId: number;
  title: string;
  description: string;
  /** Epoch ms of the summary that revealed the change. */
  at: number;
  read: boolean;
};

const MESSAGES: Record<NotificationKind, (plant: string, device: string) => [string, string]> = {
  'needs-water': (plant, device) => [
    `${plant} needs water`,
    `Moisture is at or below the minimum (${device}).`
  ],
  offline: (plant, device) => [`${plant} is offline`, `${device} has stopped reporting.`],
  'sensor-fault': (plant, device) => [
    `${plant} has a sensor fault`,
    `${device} is missing a sensor reading.`
  ],
  irrigating: (plant, device) => [`Irrigating ${plant}`, `${device} turned the pump on.`]
};

const NOTIFY_ON: ReadonlySet<PlantStatus> = new Set([
  'needs-water',
  'offline',
  'sensor-fault',
  'irrigating'
]);

/** Notifications for plants whose status changed into one worth telling the user about. */
export function detectChanges(prev: DashboardSummary, next: DashboardSummary): AppNotification[] {
  const before = new Map(prev.plants.map((p) => [p.id, p.status]));
  const at = Date.parse(next.generatedAt);
  const found: AppNotification[] = [];
  for (const plant of next.plants) {
    const was = before.get(plant.id);
    // A plant that wasn't in the previous summary is new, not changed.
    if (was === undefined || was === plant.status || !NOTIFY_ON.has(plant.status)) continue;
    const kind = plant.status as NotificationKind;
    const [title, description] = MESSAGES[kind](plant.name, plant.deviceName);
    found.push({
      id: `${plant.id}:${kind}:${at}`,
      kind,
      plantId: plant.id,
      title,
      description,
      at,
      read: false
    });
  }
  return found;
}
