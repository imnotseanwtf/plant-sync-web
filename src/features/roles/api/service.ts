'use server';

import { Prisma } from '../../../../generated/prisma/client';
import { requirePermission } from '@/lib/auth/current-user';
import { guardManagers } from '@/lib/auth/managers';
import { isPermission } from '@/lib/auth/rbac';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, sortBy } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import type { ListFilters, ListResponse } from '@/types/resource';
import { roleSchema } from '../schemas/role';
import type { RoleMutationPayload, RoleOption, RoleRow } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.

const select = {
  id: true,
  name: true,
  description: true,
  permissions: true,
  _count: { select: { users: true } }
} satisfies Prisma.RoleSelect;

const NAME_TAKEN = 'A role with that name already exists.';

const toRole = (r: Prisma.RoleGetPayload<{ select: typeof select }>): RoleRow => ({
  id: Number(r.id),
  name: r.name,
  description: r.description ?? '',
  permissions: r.permissions.filter(isPermission),
  userCount: r._count.users
});

function roleWhere(filters: Pick<ListFilters, 'search'>): Prisma.RoleWhereInput {
  return filters.search ? { name: { contains: filters.search, mode: 'insensitive' } } : {};
}

export async function getRoles(filters: ListFilters): Promise<ListResponse<RoleRow>> {
  await requirePermission('users:manage');
  const [rows, total] = await Promise.all([
    prisma.role.findMany({
      where: roleWhere(filters),
      select,
      orderBy: [
        ...sortBy<Prisma.RoleOrderByWithRelationInput>(filters.sort, filters.dir, {
          name: (d) => ({ name: d })
        }),
        { name: 'asc' }
      ],
      ...paging(filters.page, filters.limit)
    }),
    prisma.role.count({ where: roleWhere(filters) })
  ]);
  return { rows: rows.map(toRole), total };
}

export async function getRoleIds(filters: Pick<ListFilters, 'search'>): Promise<number[]> {
  await requirePermission('users:manage');
  const rows = await prisma.role.findMany({ where: roleWhere(filters), select: { id: true } });
  return rows.map((r) => Number(r.id));
}

/** Every role, for the user form's role picker and the users table filter. */
export async function getRoleOptions(): Promise<RoleOption[]> {
  await requirePermission('users:manage');
  const rows = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  return rows.map((r) => ({ value: String(r.id), label: r.name }));
}

export async function createRole(data: RoleMutationPayload): Promise<ActionResult<RoleRow>> {
  await requirePermission('users:manage');
  const parsed = roleSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const role = await prisma.role.create({
      data: { ...parsed.data, description: parsed.data.description || null },
      select
    });
    return ok(toRole(role));
  } catch (e) {
    return dbError(e, { unique: NAME_TAKEN });
  }
}

export async function updateRole(
  id: number,
  data: RoleMutationPayload
): Promise<ActionResult<RoleRow>> {
  await requirePermission('users:manage');
  const parsed = roleSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const result = await guardManagers(
    (tx) =>
      tx.role.update({
        where: { id: BigInt(id) },
        data: { ...parsed.data, description: parsed.data.description || null },
        select
      }),
    { unique: NAME_TAKEN, notFound: 'Role not found.' }
  );
  return result.ok ? ok(toRole(result.data)) : result;
}

/** Users who only had a deleted role are left with none and can only read. */
export async function deleteRoles(ids: number[]): Promise<ActionResult<number>> {
  await requirePermission('users:manage');
  const result = await guardManagers(
    (tx) => tx.role.deleteMany({ where: { id: { in: ids.map(BigInt) } } }),
    { notFound: 'Role not found.' }
  );
  return result.ok ? ok(result.data.count) : result;
}
