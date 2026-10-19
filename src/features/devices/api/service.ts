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

/** Search by name; `plant` filters to devices with or without a plant. */
function deviceWhere(
  filters: Pick<ListFilters, 'search' | 'filters'>
): Prisma.DeviceIdentifierWhereInput {
  const plant = filters.filters?.plant;
  return {
    ...(filters.search && { name: { contains: filters.search, mode: 'insensitive' } }),
    ...(plant === 'with' && { plant: { isNot: null } }),
    ...(plant === 'without' && { plant: null })
  };
}

export async function getDevices(filters: ListFilters): Promise<ListResponse<Device>> {
  await requirePermission('view:devices');
  const [rows, total] = await Promise.all([
    prisma.deviceIdentifier.findMany({
      where: deviceWhere(filters),
      select,
      orderBy: [
        ...sortBy(filters.sort, filters.dir, { name: (d) => ({ name: d }) }),
        { createdAt: 'desc' }
      ],
      ...paging(filters.page, filters.limit)
    }),
    prisma.deviceIdentifier.count({ where: deviceWhere(filters) })
  ]);
  return { rows: rows.map(toDevice), total };
}

export async function getDevice(id: string): Promise<Device | null> {
  await requirePermission('view:devices');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const device = await prisma.deviceIdentifier.findUnique({ where: { id }, select });
  return device ? toDevice(device) : null;
}

export async function getDeviceIds(
  filters: Pick<ListFilters, 'search' | 'filters'>
): Promise<string[]> {
  await requirePermission('view:devices');
  const rows = await prisma.deviceIdentifier.findMany({
    where: deviceWhere(filters),
    select: { id: true }
  });
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

/** The wiring design from a form payload, or the first thing wrong with it. */
function checkWiring(data: unknown): { design: WiringDesign } | { error: string } {
  const parsed = wiringSchema.safeParse(data);
  if (!parsed.success) return { error: 'The wiring design is not valid.' };
  const errors = designErrors(parsed.data);
  return errors.length ? { error: errors[0] } : { design: parsed.data };
}

export async function createDevice(data: DeviceMutationPayload): Promise<ActionResult<Device>> {
  await requirePermission('create:devices');
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const wiring = checkWiring(data.wiring);
  if ('error' in wiring) return fail(wiring.error);
  try {
    return ok(
      toDevice(
        await prisma.deviceIdentifier.create({
          data: { name: parsed.data.name, wiring: wiring.design as Prisma.InputJsonValue },
          select
        })
      )
    );
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN });
  }
}

export async function updateDevice(
  id: string,
  data: DeviceMutationPayload
): Promise<ActionResult<Device>> {
  await requirePermission('edit:devices');
  const parsed = deviceSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const wiring = checkWiring(data.wiring);
  if ('error' in wiring) return fail(wiring.error);
  try {
    return ok(
      toDevice(
        await prisma.deviceIdentifier.update({
          where: { id },
          data: { name: parsed.data.name, wiring: wiring.design as Prisma.InputJsonValue },
          select
        })
      )
    );
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN, notFound: 'Device not found.' });
  }
}

/** Deleting a device also deletes its plant and all of its readings (ON DELETE CASCADE). */
export async function deleteDevices(ids: string[]): Promise<ActionResult<number>> {
  await requirePermission('delete:devices');
  const { count } = await prisma.deviceIdentifier.deleteMany({ where: { id: { in: ids } } });
  return ok(count);
}
