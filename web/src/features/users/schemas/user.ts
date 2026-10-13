import * as z from 'zod';

const base = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email'))
};

export const createUserSchema = z.object({
  ...base,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72)
});

/** Leave the password empty to keep the current one. */
export const updateUserSchema = z.object({
  ...base,
  password: z.union([
    z.literal(''),
    z.string().min(8, 'Password must be at least 8 characters').max(72)
  ])
});

export type UserFormValues = z.infer<typeof createUserSchema>;
