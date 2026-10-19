'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { Badge } from '@/components/ui/badge';
import { PERMISSION_LABELS } from '@/lib/auth/rbac';
import { deleteRolesAndRefresh } from '../api/mutations';
import { roleKeys } from '../api/queries';
import { getRoleIds, getRoles } from '../api/service';
import type { RoleRow } from '../api/types';
import { RoleFormSheet } from './role-form-sheet';

const columns: ResourceColumn<RoleRow>[] = [
  {
    id: 'name',
    label: 'Name',
    sortable: true,
    cell: (r) => <span className='font-medium'>{r.name}</span>
  },
  {
    id: 'description',
    label: 'Description',
    cell: (r) => <span className='text-muted-foreground'>{r.description || '—'}</span>
  },
  {
    id: 'permissions',
    label: 'Permissions',
    cell: (r) =>
      r.permissions.length === 0 ? (
        <span className='text-muted-foreground'>View only</span>
      ) : (
        <div className='flex flex-wrap gap-1'>
          {r.permissions.map((p) => (
            <Badge key={p} variant='secondary'>
              {PERMISSION_LABELS[p]}
            </Badge>
          ))}
        </div>
      )
  },
  { id: 'userCount', label: 'Users', cell: (r) => r.userCount }
];

export function RoleTable() {
  return (
    <ResourceTable
      noun={{ singular: 'role', plural: 'roles' }}
      columns={columns}
      getId={(r) => r.id}
      queryKey={roleKeys.list}
      fetchList={getRoles}
      deleteMany={deleteRolesAndRefresh}
      getAllIds={getRoleIds}
      renderEditor={({ row, open, onOpenChange }) => (
        <RoleFormSheet role={row ?? undefined} open={open} onOpenChange={onOpenChange} />
      )}
    />
  );
}
