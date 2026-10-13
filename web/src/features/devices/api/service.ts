'use server';

import { requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, sortBy } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import type { ListFilters, ListResponse } from '@/types/resource';
import { deviceSchema } from '../schemas/device';
import type { Device, DeviceMutationPayload, DeviceOption } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const select = { id: true, name: true } as const;
const NAME_TAKEN = 'The name has already been taken.';

export async function getDevices(filters: ListFilters): Promise<ListResponse<Device>> {
  await requireUser();
  const [rows, total] = await Promise.all([
    prisma.deviceIdentifier.findMany({
      select,
      orderBy: [
        ...sortBy(filters.sort, filters.dir, { name: (d) => ({ name: d }) }),
        { createdAt: 'desc' }
      ],
      ...paging(filters.page, filters.limit)
    }),
    prisma.deviceIdentifier.count()
  ]);
  return { rows, total };
}

export async function getDevice(id: string): Promise<Device | null> {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return prisma.deviceIdentifier.findUnique({ where: { id }, select });
}

export async function getDeviceIds(): Promise<string[]> {
  await requireUser();
  const rows = await prisma.deviceIdentifier.findMany({ select: { id: true } });
  return rows.map((r) => r.id);
}

/** Devices that don't have a plant yet (the Filament create form only offers these). */
export async function getDeviceOptions(): Promise<DeviceOption[]> {
  await requireUser();
  const devices = await prisma.deviceIdentifier.findMany({
    where: { plant: null },
    select,
    orderBy: { name: 'asc' }
  });
  return devices.map((d) => ({ value: d.id, label: d.name }));
}

export async function createDevice(data: DeviceMutationPayload): Promise<ActionResult<Device>> {
  await requireUser();
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    return ok(await prisma.deviceIdentifier.create({ data: parsed.data, select }));
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN });
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
    return ok(await prisma.deviceIdentifier.update({ where: { id }, data: parsed.data, select }));
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN, notFound: 'Device not found.' });
  }
}

/** Deleting a device also deletes its plant and all of its readings (ON DELETE CASCADE). */
export async function deleteDevices(ids: string[]): Promise<ActionResult<number>> {
  await requireUser();
  const { count } = await prisma.deviceIdentifier.deleteMany({ where: { id: { in: ids } } });
  return ok(count);
}
