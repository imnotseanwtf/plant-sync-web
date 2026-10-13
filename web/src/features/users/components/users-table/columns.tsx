'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import type { Column, ColumnDef } from '@tanstack/react-table';
import type { AppUser } from '../../api/types';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AppUser>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<AppUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>,
    meta: {
      label: 'Name',
      placeholder: 'Search users...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'EMAIL',
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
