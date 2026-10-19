// Shared by server and client code, so it must stay free of server-only imports.

export const ROLES = ['admin', 'operator', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer'
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access, including users, roles and this screen.',
  operator: 'Runs the plants: manages plants and devices, but not users.',
  viewer: 'Read-only: sees the dashboard, plants and devices.'
};

/** Every signed-in user can read; these cover the writes. */
export const PERMISSIONS = ['plants:write', 'devices:write', 'users:manage'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'plants:write': 'Create, edit and delete plants',
  'devices:write': 'Create, edit, wire and delete device identifiers',
  'users:manage': 'Manage users and roles'
};

const GRANTS: Record<Role, readonly Permission[]> = {
  admin: ['plants:write', 'devices:write', 'users:manage'],
  operator: ['plants:write', 'devices:write'],
  viewer: []
};

export function can(role: Role | undefined, permission: Permission | undefined) {
  if (!permission) return true;
  return !!role && GRANTS[role].includes(permission);
}

export const permissionsOf = (role: Role) => PERMISSIONS.filter((p) => can(role, p));
