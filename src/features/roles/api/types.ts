import type { Permission } from '@/lib/auth/rbac';

export type RoleRow = {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
};

export type RoleMutationPayload = {
  name: string;
  description: string;
  permissions: Permission[];
};

export type RoleOption = { value: string; label: string };
