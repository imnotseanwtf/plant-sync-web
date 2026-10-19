'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { deleteUsersAndRefresh } from '../api/mutations';
import { userKeys } from '../api/queries';
import { getUserIds, getUsers } from '../api/service';
import type { AppUser } from '../api/types';
import { UserFormSheet } from './user-form-sheet';

const columns: ResourceColumn<AppUser>[] = [
  { id: 'name', label: 'Name', cell: (u) => u.name },
  { id: 'role', label: 'Role', cell: (u) => ROLE_LABELS[u.role] }
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
      getAllIds={() => getUserIds()}
      renderEditor={({ row, open, onOpenChange }) => (
        <UserFormSheet user={row ?? undefined} open={open} onOpenChange={onOpenChange} />
      )}
    />
  );
}
