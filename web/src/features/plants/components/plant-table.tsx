'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { ResourceDataTable } from '@/components/resource/resource-data-table';
import { RowActions } from '@/components/resource/row-actions';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { deletePlantsAndRefresh } from '../api/mutations';
import { plantKeys } from '../api/queries';
import { getPlants } from '../api/service';
import type { Plant } from '../api/types';

const n = (value: number) => value.toLocaleString('en-US');
const header = (title: string) =>
  function Header({ column }: { column: Column<Plant, unknown> }) {
    return <DataTableColumnHeader column={column} title={title} />;
  };

// Same columns as the Filament table, all sortable; the name box searches plant and device names.
const columns: ColumnDef<Plant>[] = [
  { id: 'deviceName', accessorKey: 'deviceName', header: header('Device identifier') },
  {
    id: 'name',
    accessorKey: 'name',
    header: header('Name'),
    meta: {
      label: 'Name',
      placeholder: 'Search plants or devices...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'moistureLevelMin',
    accessorKey: 'moistureLevelMin',
    header: header('Moisture level min'),
    cell: ({ row }) => `${n(row.original.moistureLevelMin)}%`
  },
  {
    id: 'moistureLevelMax',
    accessorKey: 'moistureLevelMax',
    header: header('Moisture level max'),
    cell: ({ row }) => `${n(row.original.moistureLevelMax)}%`
  },
  {
    id: 'humidity',
    accessorKey: 'humidity',
    header: header('Humidity'),
    cell: ({ row }) => `${n(row.original.humidity)}%`
  },
  {
    id: 'temperature',
    accessorKey: 'temperature',
    header: header('Temperature'),
    cell: ({ row }) => `${n(row.original.temperature)}°C`
  },
  {
    id: 'lightIntensity',
    accessorKey: 'lightIntensity',
    header: header('Light intensity'),
    cell: ({ row }) => `${n(row.original.lightIntensity)} lux`
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <RowActions
        editHref={`/dashboard/plants/${row.original.id}/edit`}
        title={`Delete ${row.original.name}?`}
        onDelete={() => deletePlantsAndRefresh([row.original.id])}
      />
    )
  }
];

export function PlantTable() {
  return (
    <ResourceDataTable
      noun={{ singular: 'plant', plural: 'plants' }}
      columns={columns}
      getRowId={(p) => p.id}
      queryKey={plantKeys.list}
      fetchList={getPlants}
      deleteMany={deletePlantsAndRefresh}
    />
  );
}
