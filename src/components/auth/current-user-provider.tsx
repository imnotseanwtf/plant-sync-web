'use client';

import { createContext, useContext } from 'react';
import { can, type Permission, type Role } from '@/lib/auth/rbac';

const RoleContext = createContext<Role | undefined>(undefined);

export function CurrentRoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

/** UI-only gate; the server re-checks every permission in `requirePermission`. */
export function useCan() {
  const role = useContext(RoleContext);
  return (permission?: Permission) => can(role, permission);
}
