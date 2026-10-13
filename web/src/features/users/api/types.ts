export type AppUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
};

export type UsersResponse = { users: AppUser[]; total: number };

export type UserMutationPayload = {
  name: string;
  email: string;
  /** Required when creating; empty or omitted on update keeps the current password. */
  password: string;
};
