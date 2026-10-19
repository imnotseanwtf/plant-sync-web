'use client';

import { createContext, useContext } from 'react';
import { can, type Permission } from '@/lib/auth/rbac';

const PermissionsContext = createContext<readonly Permission[] | undefined>(undefined);

export function CurrentPermissionsProvider({
  permissions,
  children
}: {
  permissions: readonly Permission[];
  children: React.ReactNode;
}) {
  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>;
}

/** UI-only gate; the server re-checks every permission in `requirePermission`. */
export function useCan() {
  const permissions = useContext(PermissionsContext);
  return (permission?: Permission) => can(permissions, permission);
}
