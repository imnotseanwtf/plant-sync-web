// Shared by server and client code, so it must stay free of server-only imports.

export const ROLES = ['admin', 'operator', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer'
};

/** Every signed-in user can read; these cover the writes. */
export type Permission = 'plants:write' | 'devices:write' | 'users:manage';

const GRANTS: Record<Role, readonly Permission[]> = {
  admin: ['plants:write', 'devices:write', 'users:manage'],
  operator: ['plants:write', 'devices:write'],
  viewer: []
};

export function can(role: Role | undefined, permission: Permission | undefined) {
  if (!permission) return true;
  return !!role && GRANTS[role].includes(permission);
}
