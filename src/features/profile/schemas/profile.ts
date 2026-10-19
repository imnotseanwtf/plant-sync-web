import * as z from 'zod';

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'The name field is required.').max(255),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('The email field must be a valid email address.'))
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'The current password field is required.'),
    password: z.string().min(8, 'The new password must be at least 8 characters.').max(72),
    passwordConfirmation: z.string().min(1, 'The confirm password field is required.')
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'The confirm password field must match the new password.'
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
