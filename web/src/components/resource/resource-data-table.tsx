'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { toListFilters } from '@/lib/list-filters';
import { getSortingStateParser } from '@/lib/parsers';
import type { ListFilters, ListResponse } from '@/types/resource';

type Props<T> = {
  noun: { singular: string; plural: string };
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string | number;
  /** Must match the key used by the server-side prefetch so the hydrated data is reused. */
  queryKey: (filters: ListFilters) => readonly unknown[];
  fetchList: (filters: ListFilters) => Promise<ListResponse<T>>;
  deleteMany: (ids: (string | number)[]) => Promise<unknown>;
};

/** The starter's DataTable (TanStack + nuqs) with a checkbox column and a bulk-delete bar. */
export function ResourceDataTable<T>({
  noun,
  columns,
  getRowId,
  queryKey,
  fetchList,
  deleteMany
}: Props<T>) {
  const allColumns: ColumnDef<T>[] = [
    {
      id: 'select',
      size: 40,
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          aria-label='Select all on this page'
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Select ${noun.singular}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        />
      )
    },
    ...columns
  ];
  const columnIds = allColumns.map((c) => c.id).filter(Boolean) as string[];

  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });
  const filters = toListFilters({
    page: params.page,
    perPage: params.perPage,
    name: params.name,
    sorting: params.sort
  });

  const { data } = useQuery({
    queryKey: queryKey(filters),
    queryFn: () => fetchList(filters),
    placeholderData: keepPreviousData
  });

  const { table } = useDataTable({
    data: data?.rows ?? [],
    columns: allColumns,
    pageCount: Math.ceil((data?.total ?? 0) / params.perPage),
    getRowId: (row) => String(getRowId(row)),
    shallow: true,
    debounceMs: 500,
    initialState: { columnPinning: { right: ['actions'] } }
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const selectedIds = table.getSelectedRowModel().rows.map((r) => getRowId(r.original));

  const bulkDelete = useMutation({
    mutationFn: () => deleteMany(selectedIds),
    onSuccess: () => {
      toast.success('Deleted');
      table.resetRowSelection();
      setConfirmOpen(false);
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <>
      <DataTable
        table={table}
        actionBar={
          <div className='flex items-center justify-between rounded-lg border p-3'>
            <span className='text-sm'>
              {selectedIds.length} {selectedIds.length === 1 ? noun.singular : noun.plural} selected
            </span>
            <Button variant='destructive' size='sm' onClick={() => setConfirmOpen(true)}>
              Delete selected
            </Button>
          </div>
        }
      >
        <DataTableToolbar table={table} />
      </DataTable>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => bulkDelete.mutate()}
        loading={bulkDelete.isPending}
        title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? noun.singular : noun.plural}?`}
        description='This action cannot be undone.'
      />
    </>
  );
}
