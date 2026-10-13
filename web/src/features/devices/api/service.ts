'use server';

import type { Prisma } from '../../../../generated/prisma/client';
import { requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, parseSort } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import { deviceSchema } from '../schemas/device';
import type {
  Device,
  DeviceFilters,
  DeviceMutationPayload,
  DeviceOption,
  DevicesResponse
} from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const deviceSelect = {
  id: true,
  name: true,
  createdAt: true,
  plant: { select: { name: true } },
  sensorValues: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
} satisfies Prisma.DeviceIdentifierSelect;

function toDevice(d: Prisma.DeviceIdentifierGetPayload<{ select: typeof deviceSelect }>): Device {
  return {
    id: d.id,
    name: d.name,
    plantName: d.plant?.name ?? null,
    lastReadingAt: d.sensorValues[0]?.createdAt.toISOString() ?? null,
    createdAt: d.createdAt.toISOString()
  };
}

export async function getDevices(filters: DeviceFilters): Promise<DevicesResponse> {
  await requireUser();
  const where: Prisma.DeviceIdentifierWhereInput = filters.search
    ? { name: { contains: filters.search, mode: 'insensitive' } }
    : {};
  const orderBy = parseSort(filters.sort, { name: 'name' });

  const [devices, total] = await Promise.all([
    prisma.deviceIdentifier.findMany({
      where,
      select: deviceSelect,
      orderBy: orderBy.length ? orderBy : { createdAt: 'desc' },
      ...paging(filters.page, filters.limit)
    }),
    prisma.deviceIdentifier.count({ where })
  ]);
  return { devices: devices.map(toDevice), total };
}

/** Devices that can still be attached to a plant (plus the one already attached to `plantId`). */
export async function getDeviceOptions(plantId?: number): Promise<DeviceOption[]> {
  await requireUser();
  const devices = await prisma.deviceIdentifier.findMany({
    where: {
      OR: [{ plant: null }, ...(plantId ? [{ plant: { id: BigInt(plantId) } }] : [])]
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  return devices.map((d) => ({ value: d.id, label: d.name }));
}

export async function createDevice(data: DeviceMutationPayload): Promise<ActionResult<Device>> {
  await requireUser();
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const device = await prisma.deviceIdentifier.create({
      data: parsed.data,
      select: deviceSelect
    });
    return ok(toDevice(device));
  } catch (e) {
    return dbError(e, { unique: 'A device with that name already exists.' });
  }
}

export async function updateDevice(
  id: string,
  data: DeviceMutationPayload
): Promise<ActionResult<Device>> {
  await requireUser();
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const device = await prisma.deviceIdentifier.update({
      where: { id },
      data: parsed.data,
      select: deviceSelect
    });
    return ok(toDevice(device));
  } catch (e) {
    return dbError(e, {
      unique: 'A device with that name already exists.',
      notFound: 'Device not found.'
    });
  }
}

/** Deleting a device also deletes its plant and all of its readings (ON DELETE CASCADE). */
export async function deleteDevice(id: string): Promise<ActionResult<null>> {
  await requireUser();
  try {
    await prisma.deviceIdentifier.delete({ where: { id } });
    return ok(null);
  } catch (e) {
    return dbError(e, { notFound: 'Device not found.' });
  }
}
