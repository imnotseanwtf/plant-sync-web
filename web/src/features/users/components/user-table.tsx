'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ResourceDataTable } from '@/components/resource/resource-data-table';
import { RowActions } from '@/components/resource/row-actions';
import { deleteUsersAndRefresh } from '../api/mutations';
import { userKeys } from '../api/queries';
import { getUsers } from '../api/service';
import type { AppUser } from '../api/types';

// Filament listed just the name.
const columns: ColumnDef<AppUser>[] = [
  { id: 'name', accessorKey: 'name', header: 'NAME', enableSorting: false },
  {
    id: 'actions',
    cell: ({ row }) => (
      <RowActions
        editHref={`/dashboard/users/${row.original.id}/edit`}
        title={`Delete ${row.original.name}?`}
        onDelete={() => deleteUsersAndRefresh([row.original.id])}
      />
    )
  }
];

export function UserTable() {
  return (
    <ResourceDataTable
      noun={{ singular: 'user', plural: 'users' }}
      columns={columns}
      getRowId={(u) => u.id}
      queryKey={userKeys.list}
      fetchList={getUsers}
      deleteMany={deleteUsersAndRefresh}
    />
  );
}
