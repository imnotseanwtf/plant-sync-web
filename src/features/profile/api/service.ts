'use server';

import { requireUser } from '@/lib/auth/current-user';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { fail, ok, type ActionResult } from '@/lib/action-result';
import { dbError } from '@/lib/db-helpers';
import { prisma } from '@/lib/prisma';
import { passwordSchema, profileSchema } from '../schemas/profile';
import type { PasswordPayload, ProfilePayload } from './types';

// Every export here is a public HTTP endpoint (server action). They only ever act on the signed-in
// user, never on an id from the client, so nobody can edit someone else's account here.

export async function updateProfile(data: ProfilePayload): Promise<ActionResult<ProfilePayload>> {
  const me = await requireUser();
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  try {
    const user = await prisma.user.update({
      where: { id: BigInt(me.id) },
      data: parsed.data,
      select: { name: true, email: true }
    });
    return ok(user);
  } catch (e) {
    return dbError(e, { unique: 'The email has already been taken.', notFound: 'User not found.' });
  }
}

/** Needs the current password, so a hijacked open session can't lock the owner out. */
export async function changePassword(data: PasswordPayload): Promise<ActionResult<null>> {
  const me = await requireUser();
  const parsed = passwordSchema.safeParse(data);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const user = await prisma.user.findUnique({
    where: { id: BigInt(me.id) },
    select: { password: true }
  });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.password))) {
    return fail('The current password is incorrect.');
  }
  if (parsed.data.password === parsed.data.currentPassword) {
    return fail('The new password must be different from the current one.');
  }
  await prisma.user.update({
    where: { id: BigInt(me.id) },
    data: { password: await hashPassword(parsed.data.password) }
  });
  return ok(null);
}
