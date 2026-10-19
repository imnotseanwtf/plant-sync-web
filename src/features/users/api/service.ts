'use server';

import { requirePermission } from '@/lib/auth/current-user';
import { hashPassword } from '@/lib/auth/password';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import type { ListFilters, ListResponse } from '@/types/resource';
import { createUserSchema, updateUserSchema } from '../schemas/user';
import type { AppUser, UserMutationPayload } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.
// `password` is never selected, so hashes cannot leak to the client.

const select = { id: true, name: true, email: true, role: true, userType: true } as const;
const toUser = (u: {
  id: bigint;
  name: string;
  email: string;
  role: AppUser['role'];
  userType: AppUser['userType'];
}): AppUser => ({
  ...u,
  id: Number(u.id)
});
const EMAIL_TAKEN = 'The email has already been taken.';
const LAST_ADMIN = 'There must be at least one admin.';

/** True when none of the admins would remain after `ids` lose that role (or are deleted). */
async function leavesNoAdmin(ids: bigint[]) {
  return (await prisma.user.count({ where: { role: 'admin', id: { notIn: ids } } })) === 0;
}

export async function getUsers(filters: ListFilters): Promise<ListResponse<AppUser>> {
  await requirePermission('users:manage');
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      select,
      orderBy: { createdAt: 'desc' },
      ...paging(filters.page, filters.limit)
    }),
    prisma.user.count()
  ]);
  return { rows: rows.map(toUser), total };
}

export async function getUser(id: number): Promise<AppUser | null> {
  await requirePermission('users:manage');
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, select });
  return user ? toUser(user) : null;
}

export async function getUserIds(): Promise<number[]> {
  await requirePermission('users:manage');
  const rows = await prisma.user.findMany({ select: { id: true } });
  return rows.map((r) => Number(r.id));
}

export async function createUser(data: UserMutationPayload): Promise<ActionResult<AppUser>> {
  await requirePermission('users:manage');
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { passwordConfirmation: _confirm, password, ...rest } = parsed.data;
  try {
    const user = await prisma.user.create({
      data: { ...rest, password: await hashPassword(password) },
      select
    });
    return ok(toUser(user));
  } catch (e) {
    return dbError(e, { unique: EMAIL_TAKEN });
  }
}

export async function updateUser(
  id: number,
  data: UserMutationPayload
): Promise<ActionResult<AppUser>> {
  await requirePermission('users:manage');
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { passwordConfirmation: _confirm, password, ...rest } = parsed.data;
  if (rest.role !== 'admin' && (await leavesNoAdmin([BigInt(id)]))) return fail(LAST_ADMIN);
  try {
    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { ...rest, ...(password && { password: await hashPassword(password) }) },
      select
    });
    return ok(toUser(user));
  } catch (e) {
    return dbError(e, { unique: EMAIL_TAKEN, notFound: 'User not found.' });
  }
}

export async function deleteUsers(ids: number[]): Promise<ActionResult<number>> {
  const me = await requirePermission('users:manage');
  if (ids.includes(me.id)) return fail("You can't delete your own account.");
  if (await leavesNoAdmin(ids.map(BigInt))) return fail(LAST_ADMIN);
  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids.map(BigInt) } } });
  return ok(count);
}
