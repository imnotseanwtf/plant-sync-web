'use server';

import type { Prisma } from '../../../../generated/prisma/client';
import { requireUser } from '@/lib/auth/current-user';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError, paging, parseSort } from '@/lib/db-helpers';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';
import { createUserSchema, updateUserSchema } from '../schemas/user';
import type { AppUser, UserFilters, UserMutationPayload, UsersResponse } from './types';

// Every export here is a public HTTP endpoint (server action), so each one authenticates.
// `password` is never selected, so hashes cannot leak to the client.

const userSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true
} satisfies Prisma.UserSelect;

const toUser = (u: Prisma.UserGetPayload<{ select: typeof userSelect }>): AppUser => ({
  id: Number(u.id),
  name: u.name,
  email: u.email,
  createdAt: u.createdAt.toISOString()
});

const EMAIL_TAKEN = 'A user with that email already exists.';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  await requireUser();
  const where: Prisma.UserWhereInput = filters.search
    ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
    : {};
  const orderBy = parseSort(filters.sort, { name: 'name' });

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: orderBy.length ? orderBy : { createdAt: 'desc' },
      ...paging(filters.page, filters.limit)
    }),
    prisma.user.count({ where })
  ]);
  return { users: users.map(toUser), total };
}

export async function createUser(data: UserMutationPayload): Promise<ActionResult<AppUser>> {
  await requireUser();
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const user = await prisma.user.create({
      data: { ...parsed.data, password: await hashPassword(parsed.data.password) },
      select: userSelect
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
  await requireUser();
  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { password, ...rest } = parsed.data;
  try {
    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { ...rest, ...(password && { password: await hashPassword(password) }) },
      select: userSelect
    });
    return ok(toUser(user));
  } catch (e) {
    return dbError(e, { unique: EMAIL_TAKEN, notFound: 'User not found.' });
  }
}

export async function deleteUser(id: number): Promise<ActionResult<null>> {
  const me = await requireUser();
  if (me.id === id) return fail("You can't delete your own account.");
  try {
    await prisma.user.delete({ where: { id: BigInt(id) } });
    return ok(null);
  } catch (e) {
    return dbError(e, { notFound: 'User not found.' });
  }
}
