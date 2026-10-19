'use client';

import { ResourceTable, type ResourceColumn } from '@/components/resource/resource-table';
import { deletePlantsAndRefresh } from '../api/mutations';
import { plantKeys } from '../api/queries';
import { getPlantIds, getPlants } from '../api/service';
import type { FilterDef } from '@/types/resource';
import type { Plant } from '../api/types';

const n = (value: number) => value.toLocaleString('en-US');

// Same columns as the Filament table; every one sortable, device and name searchable.
const columns: ResourceColumn<Plant>[] = [
  { id: 'deviceName', label: 'Device identifier', sortable: true, cell: (p) => p.deviceName },
  { id: 'name', label: 'Name', sortable: true, cell: (p) => p.name },
  {
    id: 'moistureLevelMin',
    label: 'Moisture level min',
    sortable: true,
    cell: (p) => `${n(p.moistureLevelMin)}%`
  },
  {
    id: 'moistureLevelMax',
    label: 'Moisture level max',
    sortable: true,
    cell: (p) => `${n(p.moistureLevelMax)}%`
  },
  { id: 'humidity', label: 'Humidity', sortable: true, cell: (p) => `${n(p.humidity)}%` },
  {
    id: 'temperature',
    label: 'Temperature',
    sortable: true,
    cell: (p) => `${n(p.temperature)}°C`
  },
  {
    id: 'lightIntensity',
    label: 'Light intensity',
    sortable: true,
    cell: (p) => `${n(p.lightIntensity)} lux`
  }
];

const filterDefs: FilterDef[] = [
  {
    id: 'readings',
    label: 'Plants',
    options: [
      { value: 'with', label: 'Reporting readings' },
      { value: 'without', label: 'No readings yet' }
    ]
  }
];

export function PlantTable() {
  return (
    <ResourceTable
      noun={{ singular: 'plant', plural: 'plants' }}
      columns={columns}
      getId={(p) => p.id}
      editHref={(p) => `/dashboard/plants/${p.id}/edit`}
      queryKey={plantKeys.list}
      fetchList={getPlants}
      filterDefs={filterDefs}
      editPermission='edit:plants'
      deletePermission='delete:plants'
      deleteMany={deletePlantsAndRefresh}
      getAllIds={getPlantIds}
    />
  );
}
