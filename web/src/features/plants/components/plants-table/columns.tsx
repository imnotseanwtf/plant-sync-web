'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { Column, ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import type { Plant } from '../../api/types';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Plant>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Plant, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/plants/${row.original.id}`}
        className='font-medium underline-offset-4 hover:underline'
      >
        {row.original.name}
      </Link>
    ),
    meta: {
      label: 'Name',
      placeholder: 'Search plants or devices...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'device',
    accessorKey: 'deviceName',
    header: 'DEVICE',
    enableSorting: false
  },
  {
    id: 'moisture',
    header: 'MOISTURE RANGE',
    enableSorting: false,
    cell: ({ row }) => `${row.original.moistureLevelMin}–${row.original.moistureLevelMax}%`
  },
  {
    id: 'humidity',
    header: 'HUMIDITY',
    enableSorting: false,
    cell: ({ row }) => `${row.original.humidity}%`
  },
  {
    id: 'temperature',
    header: 'TEMPERATURE',
    enableSorting: false,
    cell: ({ row }) => `${row.original.temperature}°C`
  },
  {
    id: 'light',
    header: 'LIGHT',
    enableSorting: false,
    cell: ({ row }) => `${row.original.lightIntensity} lux`
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
