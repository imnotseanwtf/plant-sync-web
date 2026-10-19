'use server';

import { Prisma } from '../../../../generated/prisma/client';
import { requireUser } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma';
import { OFFLINE_AFTER_MS } from '@/lib/sensor-health';
import { parseDesign } from '@/lib/wiring/design';
import type { DashboardSummary, MoisturePoint, PlantStatus, PlantSummary } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const BUCKET_SECONDS = 15 * 60;
const HISTORY_MS = 24 * 60 * 60 * 1000;

/** Most urgent first. */
const SEVERITY: Record<PlantStatus, number> = {
  'sensor-fault': 0,
  'needs-water': 1,
  offline: 2,
  'no-data': 3,
  irrigating: 4,
  ok: 5
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await requireUser();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const since = new Date(Date.now() - HISTORY_MS);

  const [plants, deviceCount, irrigatedToday, historyRows] = await Promise.all([
    prisma.plant.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        deviceIdentifierId: true,
        name: true,
        moistureLevelMin: true,
        moistureLevelMax: true,
        deviceIdentifier: {
          select: {
            name: true,
            wiring: true,
            sensorValues: {
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              take: 1,
              select: {
                moistureLevel: true,
                temperature: true,
                humidity: true,
                lightIntensity: true,
                isIrrigating: true,
                createdAt: true
              }
            }
          }
        }
      }
    }),
    prisma.deviceIdentifier.count(),
    prisma.sensorValue.count({ where: { isIrrigating: true, createdAt: { gte: startOfDay } } }),
    prisma.$queryRaw<{ device_id: string; bucket: number; avg: number }[]>(Prisma.sql`
      SELECT device_identifier_id::text AS device_id,
             (floor(extract(epoch FROM created_at) / ${Prisma.raw(String(BUCKET_SECONDS))})
               * ${Prisma.raw(String(BUCKET_SECONDS))})::float8 AS bucket,
             avg(moisture_level)::float8 AS avg
      FROM sensor_values
      WHERE created_at >= ${since} AND moisture_level IS NOT NULL
      GROUP BY 1, 2
      ORDER BY 2
    `)
  ]);

  const historyByDevice = new Map<string, MoisturePoint[]>();
  for (const row of historyRows) {
    const points = historyByDevice.get(row.device_id) ?? [];
    points.push({ t: row.bucket * 1000, v: row.avg });
    historyByDevice.set(row.device_id, points);
  }

  const now = Date.now();
  const summaries = plants.map((p): PlantSummary => {
    const latest = p.deviceIdentifier.sensorValues[0];
    let status: PlantStatus = 'no-data';
    if (latest) {
      if (now - latest.createdAt.getTime() > OFFLINE_AFTER_MS) status = 'offline';
      else if (latest.moistureLevel === null) {
        // No soil sensor in the wiring design means a missing moisture reading is expected.
        const design = parseDesign(p.deviceIdentifier.wiring);
        status =
          !design || design.sensors.some((s) => s.type === 'soil') ? 'sensor-fault' : 'no-data';
      } else if (latest.isIrrigating) status = 'irrigating';
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
      temperature: latest?.temperature ?? null,
      humidity: latest?.humidity ?? null,
      lightIntensity: latest?.lightIntensity ?? null,
      history: historyByDevice.get(p.deviceIdentifierId) ?? [],
      lastReadingAt: latest?.createdAt.toISOString() ?? null,
      status
    };
  });

  summaries.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.name.localeCompare(b.name));

  return {
    plantCount: plants.length,
    deviceCount,
    irrigatedToday,
    needsWater: summaries.filter((s) => s.status === 'needs-water').length,
    attention: summaries.filter((s) => SEVERITY[s.status] <= SEVERITY.offline).length,
    generatedAt: new Date(now).toISOString(),
    plants: summaries
  };
}
