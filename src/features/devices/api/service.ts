'use server';

import { Prisma } from '../../../../generated/prisma/client';
import { requirePermission, requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, sortBy } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import type { ListFilters, ListResponse } from '@/types/resource';
import { designErrors, parseDesign, wiringSchema, type WiringDesign } from '@/lib/wiring/design';
import { deviceSchema } from '../schemas/device';
import type { Device, DeviceMutationPayload, DeviceOption } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const select = { id: true, name: true, wiring: true } as const;
const toDevice = (d: { id: string; name: string; wiring: Prisma.JsonValue | null }): Device => ({
  id: d.id,
  name: d.name,
  wiring: parseDesign(d.wiring)
});
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
  return { rows: rows.map(toDevice), total };
}

export async function getDevice(id: string): Promise<Device | null> {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const device = await prisma.deviceIdentifier.findUnique({ where: { id }, select });
  return device ? toDevice(device) : null;
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
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  return devices.map((d) => ({ value: d.id, label: d.name }));
}

export async function createDevice(data: DeviceMutationPayload): Promise<ActionResult<Device>> {
  await requirePermission('devices:write');
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    return ok(toDevice(await prisma.deviceIdentifier.create({ data: parsed.data, select })));
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN });
  }
}

export async function updateDevice(
  id: string,
  data: DeviceMutationPayload
): Promise<ActionResult<Device>> {
  await requirePermission('devices:write');
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    return ok(
      toDevice(await prisma.deviceIdentifier.update({ where: { id }, data: parsed.data, select }))
    );
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN, notFound: 'Device not found.' });
  }
}

/** Deleting a device also deletes its plant and all of its readings (ON DELETE CASCADE). */
export async function deleteDevices(ids: string[]): Promise<ActionResult<number>> {
  await requirePermission('devices:write');
  const { count } = await prisma.deviceIdentifier.deleteMany({ where: { id: { in: ids } } });
  return ok(count);
}

/** Saves the board and sensor wiring for a device; `null` goes back to the default layout. */
export async function saveDeviceWiring(
  id: string,
  data: WiringDesign | null
): Promise<ActionResult<WiringDesign | null>> {
  await requirePermission('devices:write');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail('Device not found.');

  let design: WiringDesign | null = null;
  if (data !== null) {
    const parsed = wiringSchema.safeParse(data);
    if (!parsed.success) return fail('The wiring design is not valid.');
    const errors = designErrors(parsed.data);
    if (errors.length) return fail(errors[0]);
    design = parsed.data;
  }
  try {
    await prisma.deviceIdentifier.update({
      where: { id },
      data: { wiring: design ?? Prisma.DbNull },
      select: { id: true }
    });
    return ok(design);
  } catch (e) {
    return dbError(e, { notFound: 'Device not found.' });
  }
}
