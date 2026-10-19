// Shared by server and client code, so it must stay free of server-only imports.
// Roles live in the database; this is the catalog of permissions a role can be given.

export const RESOURCES = ['plants', 'devices', 'users', 'roles'] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

/** Stored as `<action>:<resource>`, e.g. `create:plants`. */
export type Permission = `${Action}:${Resource}`;

export const permission = (action: Action, resource: Resource): Permission =>
  `${action}:${resource}`;

export const PERMISSIONS: readonly Permission[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => permission(a, r))
);

export const RESOURCE_LABELS: Record<Resource, string> = {
  plants: 'Plants',
  devices: 'Devices',
  users: 'Users',
  roles: 'Roles'
};

export const ACTION_LABELS: Record<Action, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete'
};

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

/** Whether a set of permissions (the union over a user's roles) includes `needed`. */
export function can(
  permissions: readonly Permission[] | undefined,
  needed: Permission | undefined
) {
  if (!needed) return true;
  return !!permissions && permissions.includes(needed);
}

/** Whether any of `needed` is held. */
export const canAny = (
  permissions: readonly Permission[] | undefined,
  needed: readonly Permission[]
) => needed.some((p) => can(permissions, p));

/** You can't change what you can't see: create/edit/delete on a resource brings `view` with it. */
export function withImpliedView(permissions: readonly Permission[]): Permission[] {
  const set = new Set(permissions);
  for (const r of RESOURCES) {
    if (ACTIONS.some((a) => a !== 'view' && set.has(permission(a, r))))
      set.add(permission('view', r));
  }
  return PERMISSIONS.filter((p) => set.has(p));
}

/** Per resource, the actions a set of permissions allows (resources with none are left out). */
export function actionsByResource(permissions: readonly Permission[]) {
  return RESOURCES.map((resource) => ({
    resource,
    actions: ACTIONS.filter((a) => permissions.includes(permission(a, resource)))
  })).filter((r) => r.actions.length > 0);
}

const all = (resources: readonly Resource[], actions: readonly Action[] = ACTIONS) =>
  resources.flatMap((r) => actions.map((a) => permission(a, r)));

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
    permissions: all(['plants', 'devices'])
  },
  {
    name: 'Viewer',
    description: 'Read-only: sees plants and devices.',
    permissions: all(['plants', 'devices'], ['view'])
  }
];
