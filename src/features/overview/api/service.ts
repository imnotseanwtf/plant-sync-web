import { requireUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma';

export type PlantStatus =
  | 'irrigating'
  | 'needs-water'
  | 'ok'
  | 'no-data'
  | 'offline'
  | 'sensor-fault';

export type PlantSummary = {
  id: number;
  name: string;
  deviceName: string;
  moisture: number | null;
  moistureMin: number;
  moistureMax: number;
  lastReadingAt: string | null;
  status: PlantStatus;
};

export type DashboardSummary = {
  plantCount: number;
  deviceCount: number;
  irrigatedToday: number;
  needsWater: number;
  plants: PlantSummary[];
};

/** A device that hasn't reported for this long is shown as offline (it posts every few seconds). */
const OFFLINE_AFTER_MS = 10 * 60 * 1000;

/** Server-only loader for the overview page (not a server action, so it isn't a public endpoint). */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  await requireUser();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [plants, deviceCount, irrigatedToday] = await Promise.all([
    prisma.plant.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        moistureLevelMin: true,
        moistureLevelMax: true,
        deviceIdentifier: {
          select: {
            name: true,
            sensorValues: {
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              take: 1,
              select: { moistureLevel: true, isIrrigating: true, createdAt: true }
            }
          }
        }
      }
    }),
    prisma.deviceIdentifier.count(),
    prisma.sensorValue.count({ where: { isIrrigating: true, createdAt: { gte: startOfDay } } })
  ]);

  const now = Date.now();
  const summaries = plants.map((p): PlantSummary => {
    const latest = p.deviceIdentifier.sensorValues[0];
    let status: PlantStatus = 'no-data';
    if (latest) {
      if (now - latest.createdAt.getTime() > OFFLINE_AFTER_MS) status = 'offline';
      else if (latest.moistureLevel === null) status = 'sensor-fault';
      else if (latest.isIrrigating) status = 'irrigating';
      else if (latest.moistureLevel <= p.moistureLevelMin) status = 'needs-water';
      else status = 'ok';
    }
    return {
      id: Number(p.id),
      name: p.name,
      deviceName: p.deviceIdentifier.name,
      moisture: latest?.moistureLevel ?? null,
      moistureMin: p.moistureLevelMin,
      moistureMax: p.moistureLevelMax,
      lastReadingAt: latest?.createdAt.toISOString() ?? null,
      status
    };
  });

  return {
    plantCount: plants.length,
    deviceCount,
    irrigatedToday,
    needsWater: summaries.filter((s) => s.status === 'needs-water').length,
    plants: summaries
  };
}
