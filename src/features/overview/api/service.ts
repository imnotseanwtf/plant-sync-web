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
const IRRIGATION_DAYS = 14;

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

  const firstDay = new Date();
  firstDay.setUTCHours(0, 0, 0, 0);
  firstDay.setUTCDate(firstDay.getUTCDate() - (IRRIGATION_DAYS - 1));

  const since = new Date(Date.now() - HISTORY_MS);

  const [plants, deviceCount, irrigationRows, historyRows] = await Promise.all([
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
    // A watering cycle starts at a pump-on reading whose previous reading (same device) was off.
    // The window starts an hour early so a cycle that began just before it isn't counted again.
    prisma.$queryRaw<{ day: string; count: number }[]>(Prisma.sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, count(*)::int AS count
      FROM (
        SELECT created_at, is_irrigating,
               lag(is_irrigating) OVER (
                 PARTITION BY device_identifier_id ORDER BY created_at, id
               ) AS prev
        FROM sensor_values
        WHERE created_at >= ${new Date(firstDay.getTime() - 60 * 60 * 1000)}
      ) r
      WHERE is_irrigating AND NOT coalesce(prev, false) AND created_at >= ${firstDay}
      GROUP BY 1
    `),
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

  const countByDay = new Map(irrigationRows.map((r) => [r.day, r.count]));
  const irrigationByDay = Array.from({ length: IRRIGATION_DAYS }, (_, i) => {
    const d = new Date(firstDay);
    d.setUTCDate(d.getUTCDate() + i);
    const day = d.toISOString().slice(0, 10);
    return { day, count: countByDay.get(day) ?? 0 };
  });

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
    irrigatedToday: irrigationByDay[irrigationByDay.length - 1].count,
    irrigationByDay,
    needsWater: summaries.filter((s) => s.status === 'needs-water').length,
    attention: summaries.filter((s) => SEVERITY[s.status] <= SEVERITY.offline).length,
    generatedAt: new Date(now).toISOString(),
    plants: summaries
  };
}
