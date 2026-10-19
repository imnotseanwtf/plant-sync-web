'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { Badge } from '@/components/ui/badge';
import { roleOptionsQueryOptions } from '@/features/roles/api/queries';
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
  {
    id: 'roles',
    label: 'Roles',
    cell: (u) =>
      u.roles.length === 0 ? (
        <span className='text-muted-foreground'>None</span>
      ) : (
        <div className='flex flex-wrap gap-1'>
          {u.roles.map((r) => (
            <Badge key={r.id} variant='secondary'>
              {r.name}
            </Badge>
          ))}
        </div>
      )
  }
];

export function UserTable() {
  const roles = useQuery(roleOptionsQueryOptions());
  // Rebuilt only when the role list changes, so the table's URL parsers stay stable.
  const filterDefs = useMemo<FilterDef[]>(
    () => [
      { id: 'role', label: 'Roles', options: roles.data ?? [] },
      {
        id: 'userType',
        label: 'Types',
        options: USER_TYPES.map((t) => ({ value: t, label: USER_TYPE_LABELS[t] }))
      }
    ],
    [roles.data]
  );

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
