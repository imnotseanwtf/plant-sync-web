'use server';

import { requirePermission } from '@/lib/auth/current-user';
import { hashPassword } from '@/lib/auth/password';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging } from '@/lib/db-helpers';
import { Prisma } from '../../../../generated/prisma/client';
import { guardManagers } from '@/lib/auth/managers';
import { USER_TYPES } from '@/lib/auth/user-type';
import { prisma } from '@/lib/prisma';
import type { ListFilters, ListResponse } from '@/types/resource';
import { createUserSchema, updateUserSchema } from '../schemas/user';
import type { AppUser, UserMutationPayload } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.
// `password` is never selected, so hashes cannot leak to the client.

const select = {
  id: true,
  name: true,
  email: true,
  userType: true,
  roles: { select: { role: { select: { id: true, name: true } } }, orderBy: { roleId: 'asc' } }
} satisfies Prisma.UserSelect;

const toUser = (u: Prisma.UserGetPayload<{ select: typeof select }>): AppUser => ({
  id: Number(u.id),
  name: u.name,
  email: u.email,
  userType: u.userType,
  roles: u.roles.map((r) => ({ id: Number(r.role.id), name: r.role.name }))
});
const EMAIL_TAKEN = 'The email has already been taken.';
const BAD_ROLES = 'Pick valid roles.';

/** Role ids from the form as bigints, or null when any is missing from the database. */
async function resolveRoleIds(ids: string[]): Promise<bigint[] | null> {
  if (!ids.every((id) => /^\d+$/.test(id))) return null;
  const unique = [...new Set(ids)].map(BigInt);
  const found = await prisma.role.count({ where: { id: { in: unique } } });
  return found === unique.length ? unique : null;
}

/** Search by name or email; the role filter is a role id, the type filter a known user type. */
function userWhere(filters: Pick<ListFilters, 'search' | 'filters'>): Prisma.UserWhereInput {
  const { role, userType } = filters.filters ?? {};
  return {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ]
    }),
    ...(role && /^\d+$/.test(role) && { roles: { some: { roleId: BigInt(role) } } }),
    ...(USER_TYPES.some((t) => t === userType) && {
      userType: userType as (typeof USER_TYPES)[number]
    })
  };
}

export async function getUsers(filters: ListFilters): Promise<ListResponse<AppUser>> {
  await requirePermission('users:manage');
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where: userWhere(filters),
      select,
      orderBy: { createdAt: 'desc' },
      ...paging(filters.page, filters.limit)
    }),
    prisma.user.count({ where: userWhere(filters) })
  ]);
  return { rows: rows.map(toUser), total };
}

export async function getUser(id: number): Promise<AppUser | null> {
  await requirePermission('users:manage');
  const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, select });
  return user ? toUser(user) : null;
}

export async function getUserIds(
  filters: Pick<ListFilters, 'search' | 'filters'>
): Promise<number[]> {
  await requirePermission('users:manage');
  const rows = await prisma.user.findMany({ where: userWhere(filters), select: { id: true } });
  return rows.map((r) => Number(r.id));
}

export async function createUser(data: UserMutationPayload): Promise<ActionResult<AppUser>> {
  await requirePermission('users:manage');
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { passwordConfirmation: _confirm, password, roleIds, ...rest } = parsed.data;
  const roles = await resolveRoleIds(roleIds);
  if (!roles) return fail(BAD_ROLES);
  try {
    const user = await prisma.user.create({
      data: {
        ...rest,
        password: await hashPassword(password),
        roles: { create: roles.map((roleId) => ({ roleId })) }
      },
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
  const { passwordConfirmation: _confirm, password, roleIds, ...rest } = parsed.data;
  const roles = await resolveRoleIds(roleIds);
  if (!roles) return fail(BAD_ROLES);
  const hashed = password ? await hashPassword(password) : undefined;
  const result = await guardManagers(
    (tx) =>
      tx.user.update({
        where: { id: BigInt(id) },
        data: {
          ...rest,
          ...(hashed && { password: hashed }),
          roles: { deleteMany: {}, create: roles.map((roleId) => ({ roleId })) }
        },
        select
      }),
    { unique: EMAIL_TAKEN, notFound: 'User not found.' }
  );
  return result.ok ? ok(toUser(result.data)) : result;
}

export async function deleteUsers(ids: number[]): Promise<ActionResult<number>> {
  const me = await requirePermission('users:manage');
  if (ids.includes(me.id)) return fail("You can't delete your own account.");
  const result = await guardManagers((tx) =>
    tx.user.deleteMany({ where: { id: { in: ids.map(BigInt) } } })
  );
  return result.ok ? ok(result.data.count) : result;
}
