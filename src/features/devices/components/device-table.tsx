'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { deleteDevicesAndRefresh } from '../api/mutations';
import { deviceKeys } from '../api/queries';
import { getDeviceIds, getDevices } from '../api/service';
import type { FilterDef } from '@/types/resource';
import type { Device } from '../api/types';
import { DeviceFormSheet } from './device-form-sheet';

// Filament listed just `id` and `name`, neither searchable nor sortable.
const columns: ResourceColumn<Device>[] = [
  { id: 'id', label: 'Id', cell: (d) => d.id },
  { id: 'name', label: 'Name', cell: (d) => d.name }
];

const filterDefs: FilterDef[] = [
  {
    id: 'plant',
    label: 'Devices',
    options: [
      { value: 'with', label: 'With a plant' },
      { value: 'without', label: 'Without a plant' }
    ]
  }
];

export function DeviceTable() {
  return (
    <ResourceTable
      noun={{ singular: 'device identifier', plural: 'device identifiers' }}
      columns={columns}
      getId={(d) => d.id}
      queryKey={deviceKeys.list}
      fetchList={getDevices}
      deleteMany={deleteDevicesAndRefresh}
      filterDefs={filterDefs}
      getAllIds={getDeviceIds}
      writePermission='devices:write'
      renderEditor={({ row, open, onOpenChange }) => (
        <DeviceFormSheet device={row ?? undefined} open={open} onOpenChange={onOpenChange} />
      )}
    />
  );
}
