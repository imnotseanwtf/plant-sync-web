export type AppUser = { id: number; name: string; email: string };

export type UserMutationPayload = {
  name: string;
  email: string;
  /** Required when creating; empty on update keeps the current password. */
  password: string;
  passwordConfirmation: string;
};
