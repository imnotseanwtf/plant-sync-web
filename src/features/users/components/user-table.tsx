'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { ROLES, ROLE_LABELS } from '@/lib/auth/rbac';
import { USER_TYPES, USER_TYPE_LABELS } from '@/lib/auth/user-type';
import type { FilterDef } from '@/types/resource';
import { deleteUsersAndRefresh } from '../api/mutations';
import { userKeys } from '../api/queries';
import { getUserIds, getUsers } from '../api/service';
import type { AppUser } from '../api/types';
import { UserFormSheet } from './user-form-sheet';

const columns: ResourceColumn<AppUser>[] = [
  { id: 'name', label: 'Name', cell: (u) => u.name },
  { id: 'userType', label: 'User type', cell: (u) => USER_TYPE_LABELS[u.userType] },
  { id: 'role', label: 'Role', cell: (u) => ROLE_LABELS[u.role] }
];

const filterDefs: FilterDef[] = [
  { id: 'role', label: 'Roles', options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) },
  {
    id: 'userType',
    label: 'Types',
    options: USER_TYPES.map((t) => ({ value: t, label: USER_TYPE_LABELS[t] }))
  }
];

export function UserTable() {
  return (
    <ResourceTable
      noun={{ singular: 'user', plural: 'users' }}
      columns={columns}
      getId={(u) => u.id}
      queryKey={userKeys.list}
      fetchList={getUsers}
      deleteMany={deleteUsersAndRefresh}
      filterDefs={filterDefs}
      getAllIds={getUserIds}
      renderEditor={({ row, open, onOpenChange }) => (
        <UserFormSheet user={row ?? undefined} open={open} onOpenChange={onOpenChange} />
      )}
    />
  );
}
