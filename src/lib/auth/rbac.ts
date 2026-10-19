// Shared by server and client code, so it must stay free of server-only imports.
// Roles live in the database; this is the catalog of permissions a role can be given.

/** Every signed-in user can read; these cover the writes. */
export const PERMISSIONS = ['plants:write', 'devices:write', 'users:manage'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'plants:write': 'Create, edit and delete plants',
  'devices:write': 'Create, edit, wire and delete device identifiers',
  'users:manage': 'Manage users and roles'
};

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

/** Whether a set of permissions (the union over a user's roles) includes `permission`. */
export function can(
  permissions: readonly Permission[] | undefined,
  permission: Permission | undefined
) {
  if (!permission) return true;
  return !!permissions && permissions.includes(permission);
}

/** The roles every database starts with (also created by the migration and the seeder). */
export const DEFAULT_ROLES: readonly {
  name: string;
  description: string;
  permissions: readonly Permission[];
}[] = [
  {
    name: 'Admin',
    description: 'Full access, including users and roles.',
    permissions: PERMISSIONS
  },
  {
    name: 'Operator',
    description: 'Runs the plants: manages plants and devices, but not users.',
    permissions: ['plants:write', 'devices:write']
  },
  {
    name: 'Viewer',
    description: 'Read-only: sees the dashboard, plants and devices.',
    permissions: []
  }
];
