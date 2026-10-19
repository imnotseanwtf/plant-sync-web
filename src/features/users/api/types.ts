import type { Role } from '@/lib/auth/rbac';

export type AppUser = { id: number; name: string; email: string; role: Role };

export type UserMutationPayload = {
  name: string;
  email: string;
  role: Role;
  /** Required when creating; empty on update keeps the current password. */
  password: string;
  passwordConfirmation: string;
};
