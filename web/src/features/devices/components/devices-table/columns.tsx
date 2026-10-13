'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { Column, ColumnDef } from '@tanstack/react-table';
import type { Device } from '../../api/types';
import { CellAction } from './cell-action';
import { CopyId } from './copy-id';

export const columns: ColumnDef<Device>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Device, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
    meta: {
      label: 'Name',
      placeholder: 'Search devices...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'deviceId',
    accessorKey: 'id',
    header: 'DEVICE ID',
    enableSorting: false,
    cell: ({ row }) => <CopyId value={row.original.id} />
  },
  {
    id: 'plant',
    accessorKey: 'plantName',
    header: 'PLANT',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.plantName ? (
        <Badge variant='outline'>{row.original.plantName}</Badge>
      ) : (
        <span className='text-muted-foreground'>Unassigned</span>
      )
  },
  {
    id: 'lastReading',
    accessorKey: 'lastReadingAt',
    header: 'LAST READING',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.lastReadingAt ? (
        // Rendered in the viewer's timezone, so the server/client strings can differ.
        <span suppressHydrationWarning>
          {new Date(row.original.lastReadingAt).toLocaleString()}
        </span>
      ) : (
        <span className='text-muted-foreground'>No data</span>
      )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
