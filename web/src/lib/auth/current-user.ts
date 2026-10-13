import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, verifySessionToken } from './session';

export type CurrentUser = { id: number; name: string; email: string };

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
    select: { id: true, name: true, email: true }
  });
  return user ? { ...user, id: Number(user.id) } : null;
});

/** Call at the top of every page data loader and server action; they are public endpoints. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}
