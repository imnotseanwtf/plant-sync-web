import type { UserType } from '@/lib/auth/user-type';

export type AppUser = {
  id: number;
  name: string;
  email: string;
  userType: UserType;
  /** A user can hold several roles. */
  roles: { id: number; name: string }[];
};

export type UserMutationPayload = {
  name: string;
  email: string;
  userType: UserType;
  /** Role ids, at least one. */
  roleIds: string[];
  /** Required when creating; empty on update keeps the current password. */
  password: string;
  passwordConfirmation: string;
};
