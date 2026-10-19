'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { Badge } from '@/components/ui/badge';
import { ACTIONS, ACTION_LABELS, RESOURCE_LABELS, actionsByResource } from '@/lib/auth/rbac';
import { deleteRolesAndRefresh } from '../api/mutations';
import { roleKeys } from '../api/queries';
import { getRoleIds, getRoles } from '../api/service';
import type { RoleRow } from '../api/types';

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
        <span className='text-muted-foreground'>No permissions</span>
      ) : (
        <div className='flex flex-wrap gap-1'>
          {actionsByResource(r.permissions).map(({ resource, actions }) => (
            <Badge key={resource} variant='secondary'>
              {RESOURCE_LABELS[resource]}:{' '}
              {actions.length === ACTIONS.length
                ? 'Full access'
                : actions.map((a) => ACTION_LABELS[a]).join(', ')}
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
      editPermission='edit:roles'
      deletePermission='delete:roles'
      getAllIds={getRoleIds}
      editHref={(r) => `/dashboard/roles/${r.id}/edit`}
    />
  );
}
