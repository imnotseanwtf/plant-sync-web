export type ProfilePayload = { name: string; email: string };

export type PasswordPayload = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};
