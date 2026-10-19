import * as z from 'zod';
import { ROLES } from '@/lib/auth/rbac';

const base = {
  name: z.string().trim().min(1, 'The name field is required.').max(255),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('The email field must be a valid email address.')),
  role: z.enum(ROLES, 'The role field is required.')
};

const mismatch = {
  path: ['passwordConfirmation'],
  message: 'The confirm password field must match password.'
};

export const createUserSchema = z
  .object({
    ...base,
    password: z.string().min(8, 'The password field must be at least 8 characters.').max(72),
    passwordConfirmation: z.string().min(1, 'The confirm password field is required.')
  })
  .refine((v) => v.password === v.passwordConfirmation, mismatch);

/** Unlike the Filament edit form (which demanded a new password every time), leaving it empty keeps the current one. */
export const updateUserSchema = z
  .object({
    ...base,
    password: z.union([
      z.literal(''),
      z.string().min(8, 'The password field must be at least 8 characters.').max(72)
    ]),
    passwordConfirmation: z.string()
  })
  .refine((v) => v.password === v.passwordConfirmation, mismatch);

export type UserFormValues = z.infer<typeof createUserSchema>;
