'use server';

import type { Prisma } from '../../../../generated/prisma/client';
import { requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, parseSort } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import { plantSchema } from '../schemas/plant';
import type {
  Plant,
  PlantFilters,
  PlantMutationPayload,
  PlantOverview,
  PlantsResponse,
  SensorReading
} from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const plantSelect = {
  id: true,
  name: true,
  deviceIdentifierId: true,
  moistureLevelMin: true,
  moistureLevelMax: true,
  humidity: true,
  temperature: true,
  lightIntensity: true,
  deviceIdentifier: { select: { name: true } }
} satisfies Prisma.PlantSelect;

function toPlant(p: Prisma.PlantGetPayload<{ select: typeof plantSelect }>): Plant {
  const { deviceIdentifier, id, ...rest } = p;
  return { ...rest, id: Number(id), deviceName: deviceIdentifier.name };
}

const UNIQUE_DEVICE = 'That device is already assigned to another plant.';

export async function getPlants(filters: PlantFilters): Promise<PlantsResponse> {
  await requireUser();
  const where: Prisma.PlantWhereInput = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { deviceIdentifier: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      }
    : {};
  const orderBy = parseSort(filters.sort, { name: 'name' });

  const [plants, total] = await Promise.all([
    prisma.plant.findMany({
      where,
      select: plantSelect,
      orderBy: orderBy.length ? orderBy : { createdAt: 'desc' },
      ...paging(filters.page, filters.limit)
    }),
    prisma.plant.count({ where })
  ]);
  return { plants: plants.map(toPlant), total };
}

export async function createPlant(data: PlantMutationPayload): Promise<ActionResult<Plant>> {
  await requireUser();
  const parsed = plantSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const plant = await prisma.plant.create({ data: parsed.data, select: plantSelect });
    return ok(toPlant(plant));
  } catch (e) {
    if (isForeignKeyError(e)) return fail('Device not found.');
    return dbError(e, { unique: UNIQUE_DEVICE });
  }
}

export async function updatePlant(
  id: number,
  data: PlantMutationPayload
): Promise<ActionResult<Plant>> {
  await requireUser();
  const parsed = plantSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const plant = await prisma.plant.update({
      where: { id: BigInt(id) },
      data: parsed.data,
      select: plantSelect
    });
    return ok(toPlant(plant));
  } catch (e) {
    if (isForeignKeyError(e)) return fail('Device not found.');
    return dbError(e, { unique: UNIQUE_DEVICE, notFound: 'Plant not found.' });
  }
}

export async function deletePlant(id: number): Promise<ActionResult<null>> {
  await requireUser();
  try {
    await prisma.plant.delete({ where: { id: BigInt(id) } });
    return ok(null);
  } catch (e) {
    return dbError(e, { notFound: 'Plant not found.' });
  }
}

function isForeignKeyError(e: unknown) {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2003';
}

export async function getPlantOverview(id: number): Promise<PlantOverview | null> {
  await requireUser();
  const plant = await prisma.plant.findUnique({
    where: { id: BigInt(id) },
    select: plantSelect
  });
  if (!plant) return null;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [rows, irrigatedToday] = await Promise.all([
    prisma.sensorValue.findMany({
      where: { deviceIdentifierId: plant.deviceIdentifierId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 30
    }),
    prisma.sensorValue.count({
      where: {
        deviceIdentifierId: plant.deviceIdentifierId,
        isIrrigating: true,
        createdAt: { gte: startOfDay }
      }
    })
  ]);

  const readings: SensorReading[] = rows.map((r) => ({
    id: Number(r.id),
    moistureLevel: r.moistureLevel,
    humidity: r.humidity,
    temperature: r.temperature,
    lightIntensity: r.lightIntensity,
    isIrrigating: r.isIrrigating,
    createdAt: r.createdAt.toISOString()
  }));

  return { plant: toPlant(plant), latest: readings[0] ?? null, irrigatedToday, readings };
}
