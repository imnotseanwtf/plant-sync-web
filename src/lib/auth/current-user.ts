import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { UserType } from './user-type';
import { can, canAny, isPermission, type Permission } from './rbac';
import { SESSION_COOKIE, verifySessionToken } from './session';

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  /** Names of the roles the user holds. */
  roles: string[];
  /** The union of those roles' permissions. */
  permissions: Permission[];
  userType: UserType;
};

/** The signed-in user, re-read from the database so deleted users lose access immediately. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  let id: bigint;
  try {
    id = BigInt(session.userId);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      userType: true,
      roles: { select: { role: { select: { name: true, permissions: true } } } }
    }
  });
  if (!user) return null;
  const { roles, ...rest } = user;
  return {
    ...rest,
    id: Number(user.id),
    roles: roles.map((r) => r.role.name),
    permissions: [...new Set(roles.flatMap((r) => r.role.permissions))].filter(isPermission)
  };
});

/** Call at the top of every page data loader and server action; they are public endpoints. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}

/** Server actions: throws unless the signed-in user holds `permission`. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.permissions, permission)) throw new Error('You do not have permission to do that.');
  return user;
}

/** Pages: sends users who lack `permission` back to the overview instead of erroring. */
export async function requirePagePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user.permissions, permission)) redirect('/dashboard/overview');
  return user;
}

/** Server actions shared by several screens (e.g. role names for the user form): any one permission will do. */
export async function requireAnyPermission(...needed: Permission[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canAny(user.permissions, needed)) throw new Error('You do not have permission to do that.');
  return user;
}
