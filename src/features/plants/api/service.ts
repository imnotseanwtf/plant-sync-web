'use server';

import type { Prisma } from '../../../../generated/prisma/client';
import { requirePermission, requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, sortBy } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import { parseDesign } from '@/lib/wiring/design';
import type { ListFilters, ListResponse } from '@/types/resource';
import { plantSchema } from '../schemas/plant';
import type { Plant, PlantMutationPayload, PlantOverview, SensorReading } from './types';

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

const DEVICE_TAKEN = 'The device identifier has already been taken.';

// Filament made the device name and plant name searchable.
function searchWhere(filters: Pick<ListFilters, 'search' | 'filters'>): Prisma.PlantWhereInput {
  const readings = filters.filters?.readings;
  return {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { deviceIdentifier: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }),
    // `readings` filters to plants whose device has (or hasn't yet) reported a sensor value.
    ...(readings === 'with' && { deviceIdentifier: { sensorValues: { some: {} } } }),
    ...(readings === 'without' && { deviceIdentifier: { sensorValues: { none: {} } } })
  };
}

export async function getPlants(filters: ListFilters): Promise<ListResponse<Plant>> {
  await requirePermission('view:plants');
  const where = searchWhere(filters);
  const orderBy: Prisma.PlantOrderByWithRelationInput[] = [
    ...sortBy<Prisma.PlantOrderByWithRelationInput>(filters.sort, filters.dir, {
      deviceName: (d) => ({ deviceIdentifier: { name: d } }),
      name: (d) => ({ name: d }),
      moistureLevelMin: (d) => ({ moistureLevelMin: d }),
      moistureLevelMax: (d) => ({ moistureLevelMax: d }),
      humidity: (d) => ({ humidity: d }),
      temperature: (d) => ({ temperature: d }),
      lightIntensity: (d) => ({ lightIntensity: d })
    }),
    { createdAt: 'desc' }
  ];

  const [rows, total] = await Promise.all([
    prisma.plant.findMany({
      where,
      select: plantSelect,
      orderBy,
      ...paging(filters.page, filters.limit)
    }),
    prisma.plant.count({ where })
  ]);
  return { rows: rows.map(toPlant), total };
}

export async function getPlant(id: number): Promise<Plant | null> {
  await requirePermission('view:plants');
  const plant = await prisma.plant.findUnique({ where: { id: BigInt(id) }, select: plantSelect });
  return plant ? toPlant(plant) : null;
}

export async function getPlantIds(
  filters: Pick<ListFilters, 'search' | 'filters'>
): Promise<number[]> {
  await requirePermission('view:plants');
  const rows = await prisma.plant.findMany({
    where: searchWhere(filters),
    select: { id: true }
  });
  return rows.map((r) => Number(r.id));
}

export async function createPlant(data: PlantMutationPayload): Promise<ActionResult<Plant>> {
  await requirePermission('create:plants');
  const parsed = plantSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const plant = await prisma.plant.create({ data: parsed.data, select: plantSelect });
    return ok(toPlant(plant));
  } catch (e) {
    if ((e as { code?: string })?.code === 'P2003') return fail('Device not found.');
    return dbError(e, { unique: DEVICE_TAKEN });
  }
}

/** The device can't be changed once a plant exists (the Filament edit form disables it). */
export async function updatePlant(
  id: number,
  data: PlantMutationPayload
): Promise<ActionResult<Plant>> {
  await requirePermission('edit:plants');
  const parsed = plantSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { deviceIdentifierId: _ignored, ...values } = parsed.data;
  try {
    const plant = await prisma.plant.update({
      where: { id: BigInt(id) },
      data: values,
      select: plantSelect
    });
    return ok(toPlant(plant));
  } catch (e) {
    return dbError(e, { notFound: 'Plant not found.' });
  }
}

export async function deletePlants(ids: number[]): Promise<ActionResult<number>> {
  await requirePermission('delete:plants');
  const { count } = await prisma.plant.deleteMany({ where: { id: { in: ids.map(BigInt) } } });
  return ok(count);
}

export async function getPlantOverview(id: number): Promise<PlantOverview | null> {
  await requirePermission('view:plants');
  const plant = await prisma.plant.findUnique({
    where: { id: BigInt(id) },
    select: plantSelect
  });
  if (!plant) return null;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [rows, irrigatedToday, device] = await Promise.all([
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
    }),
    prisma.deviceIdentifier.findUnique({
      where: { id: plant.deviceIdentifierId },
      select: { wiring: true }
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

  return {
    plant: toPlant(plant),
    latest: readings[0] ?? null,
    irrigatedToday,
    wiring: parseDesign(device?.wiring),
    readings
  };
}
