'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { DUMMY_HASH, verifyPassword } from '@/lib/auth/password';
import { createSession, destroySession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1)
});

export type SignInState = { error?: string; email?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });
  const email = String(formData.get('email') ?? '');
  if (!parsed.success) return { error: 'Enter a valid email and password.', email };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, user?.password ?? DUMMY_HASH);
  if (!user || !valid) return { error: 'Invalid email or password.', email };

  await createSession(user.id.toString());
  redirect('/dashboard/overview');
}

export async function signOut() {
  await destroySession();
  redirect('/auth/sign-in');
}
