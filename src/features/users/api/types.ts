import type { Role } from '@/lib/auth/rbac';
import type { UserType } from '@/lib/auth/user-type';

export type AppUser = { id: number; name: string; email: string; role: Role; userType: UserType };

export type UserMutationPayload = {
  name: string;
  email: string;
  role: Role;
  userType: UserType;
  /** Required when creating; empty on update keeps the current password. */
  password: string;
  passwordConfirmation: string;
};
