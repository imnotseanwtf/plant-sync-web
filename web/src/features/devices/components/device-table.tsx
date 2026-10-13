'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ResourceDataTable } from '@/components/resource/resource-data-table';
import { RowActions } from '@/components/resource/row-actions';
import { deleteDevicesAndRefresh } from '../api/mutations';
import { deviceKeys } from '../api/queries';
import { getDevices } from '../api/service';
import type { Device } from '../api/types';

// Filament listed just `id` and `name`, neither searchable nor sortable.
const columns: ColumnDef<Device>[] = [
  { id: 'id', accessorKey: 'id', header: 'ID', enableSorting: false },
  { id: 'name', accessorKey: 'name', header: 'NAME', enableSorting: false },
  {
    id: 'actions',
    cell: ({ row }) => (
      <RowActions
        editHref={`/dashboard/device-identifiers/${row.original.id}/edit`}
        title={`Delete ${row.original.name}?`}
        onDelete={() => deleteDevicesAndRefresh([row.original.id])}
      />
    )
  }
];

export function DeviceTable() {
  return (
    <ResourceDataTable
      noun={{ singular: 'device identifier', plural: 'device identifiers' }}
      columns={columns}
      getRowId={(d) => d.id}
      queryKey={deviceKeys.list}
      fetchList={getDevices}
      deleteMany={deleteDevicesAndRefresh}
    />
  );
}
