'use client';

import { useCan } from '@/components/auth/current-user-provider';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { Permission } from '@/lib/auth/rbac';
import { cn } from '@/lib/utils';
import {
  PER_PAGE_OPTIONS,
  type FilterDef,
  type ListFilters,
  type ListResponse
} from '@/types/resource';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';

export type ResourceColumn<T> = {
  id: string;
  label: string;
  /** Sortable columns toggle asc → desc → none when the header is clicked. */
  sortable?: boolean;
  cell: (row: T) => React.ReactNode;
};

type Props<T> = {
  /** Singular and plural labels, e.g. `plant` / `plants`. */
  noun: { singular: string; plural: string };
  columns: ResourceColumn<T>[];
  getId: (row: T) => string | number;
  /** Edit opens a full page (e.g. the plant page with its charts)... */
  editHref?: (row: T) => string;
  /** ...or a side panel. Provide one of the two. */
  renderEditor?: (props: {
    row: T | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => React.ReactNode;
  /** Must match the key used by the server-side prefetch so the hydrated data is reused. */
  queryKey: (filters: ListFilters) => readonly unknown[];
  fetchList: (filters: ListFilters) => Promise<ListResponse<T>>;
  /** Search box above the table; on unless a table opts out. */
  searchable?: boolean;
  /** Dropdown filters above the table (state lives in the URL as `f_<id>`). */
  filterDefs?: FilterDef[];
  deleteMany: (ids: (string | number)[]) => Promise<unknown>;
  getAllIds: (filters: Pick<ListFilters, 'search' | 'filters'>) => Promise<(string | number)[]>;
  /** Extra links shown before Edit in each row (they handle their own permissions). */
  rowActions?: (row: T) => React.ReactNode;
  /** Needed to edit rows; without it there is no editor (edit pages become "View"). */
  editPermission?: Permission;
  /** Needed to select rows and bulk delete. */
  deletePermission?: Permission;
};

export function ResourceTable<T>({
  noun,
  columns,
  getId,
  editHref,
  renderEditor,
  queryKey,
  fetchList,
  searchable = true,
  filterDefs = [],
  deleteMany,
  getAllIds,
  rowActions,
  editPermission,
  deletePermission
}: Props<T>) {
  const can = useCan();
  const canEdit = can(editPermission);
  const canDelete = can(deletePermission);
  const parsers = useMemo(
    () => ({
      page: parseAsInteger.withDefault(1),
      perPage: parseAsInteger.withDefault(10),
      search: parseAsString.withDefault(''),
      sort: parseAsString,
      dir: parseAsString,
      ...Object.fromEntries(filterDefs.map((f) => [`f_${f.id}`, parseAsString]))
    }),
    [filterDefs]
  );
  const [params, setParams] = useQueryStates(parsers);

  const activeFilters = Object.fromEntries(
    filterDefs.flatMap((f) => {
      const value = (params as Record<string, unknown>)[`f_${f.id}`];
      return typeof value === 'string' && f.options.some((o) => o.value === value)
        ? [[f.id, value]]
        : [];
    })
  );

  const filters: ListFilters = {
    page: params.page,
    limit: params.perPage,
    ...(params.search && { search: params.search }),
    ...(params.sort && { sort: params.sort, dir: params.dir === 'desc' ? 'desc' : 'asc' }),
    ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters })
  };

  const { data } = useQuery({
    queryKey: queryKey(filters),
    queryFn: () => fetchList(filters),
    placeholderData: keepPreviousData
  });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(Math.ceil(total / params.perPage), 1);

  // Search box is local state, pushed to the URL after a short pause.
  const [searchText, setSearchText] = useState(params.search);
  useEffect(() => {
    if (searchText === params.search) return;
    const id = setTimeout(() => setParams({ search: searchText || null, page: 1 }), 400);
    return () => clearTimeout(id);
  }, [searchText, params.search, setParams]);

  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const filterKey = `${params.page}|${params.perPage}|${params.search}|${params.sort}|${params.dir}|${JSON.stringify(activeFilters)}`;
  useEffect(() => setSelected(new Set()), [filterKey]);

  const pageIds = rows.map(getId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const bulkDelete = useMutation({
    mutationFn: () => deleteMany([...selected]),
    onSuccess: () => {
      toast.success('Deleted');
      setSelected(new Set());
      setConfirmOpen(false);
    },
    onError: (e) => toast.error(e.message)
  });

  const selectAll = useMutation({
    mutationFn: () =>
      getAllIds({
        search: params.search || undefined,
        ...(Object.keys(activeFilters).length > 0 && { filters: activeFilters })
      }),
    onSuccess: (ids) => setSelected(new Set(ids))
  });

  function toggleSort(column: ResourceColumn<T>) {
    if (!column.sortable) return;
    if (params.sort !== column.id) setParams({ sort: column.id, dir: 'asc', page: 1 });
    else if (params.dir !== 'desc') setParams({ dir: 'desc' });
    else setParams({ sort: null, dir: null });
  }

  const from = total === 0 ? 0 : (params.page - 1) * params.perPage + 1;
  const to = Math.min(params.page * params.perPage, total);

  return (
    <div className='bg-card overflow-hidden rounded-xl border shadow-xs'>
      {(searchable || filterDefs.length > 0 || selected.size > 0) && (
        <div className='flex items-center justify-between gap-3 p-3'>
          <div>
            {selected.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='outline' />}>
                  <Icons.moreVertical className='mr-1 size-4' />
                  Bulk actions
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='min-w-44'>
                  <DropdownMenuItem variant='destructive' onClick={() => setConfirmOpen(true)}>
                    <Icons.trash className='mr-2 size-4' />
                    Delete selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className='flex flex-1 flex-wrap items-center justify-end gap-2'>
            {filterDefs.map((f) => (
              <Select
                key={f.id}
                items={[{ value: 'all', label: `All ${f.label.toLowerCase()}` }, ...f.options]}
                value={activeFilters[f.id] ?? 'all'}
                onValueChange={(v) => setParams({ [`f_${f.id}`]: v === 'all' ? null : v, page: 1 })}
              >
                <SelectTrigger aria-label={`Filter by ${f.label.toLowerCase()}`} className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='all'>All {f.label.toLowerCase()}</SelectItem>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ))}
            {Object.keys(activeFilters).length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() =>
                  setParams({
                    ...Object.fromEntries(filterDefs.map((f) => [`f_${f.id}`, null])),
                    page: 1
                  })
                }
              >
                Reset filters
              </Button>
            )}
            {searchable && (
              <div className='relative w-full max-w-64'>
                <Icons.search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder={`Search ${noun.plural}`}
                  aria-label={`Search ${noun.plural}`}
                  className='pl-9'
                />
              </div>
            )}
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className='bg-muted/40 flex items-center justify-between border-t px-6 py-2 text-sm'>
          <span>
            {selected.size} {selected.size === 1 ? 'record' : 'records'} selected
          </span>
          <span className='flex items-center gap-3 font-medium'>
            {selected.size < total && (
              <button
                type='button'
                className='text-primary'
                disabled={selectAll.isPending}
                onClick={() => selectAll.mutate()}
              >
                Select all {total}
              </button>
            )}
            <button
              type='button'
              className='text-destructive'
              onClick={() => setSelected(new Set())}
            >
              Deselect all
            </button>
          </span>
        </div>
      )}

      <Table>
        <TableHeader className='bg-muted/40'>
          <TableRow>
            {canDelete ? (
              <TableHead className='w-10 pl-6'>
                <Checkbox
                  aria-label='Select all on this page'
                  checked={allOnPageSelected}
                  onCheckedChange={(checked) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
                      return next;
                    })
                  }
                />
              </TableHead>
            ) : (
              <TableHead className='w-6 pl-6' />
            )}
            {columns.map((column) => (
              <TableHead key={column.id} className='text-foreground font-semibold'>
                {column.sortable ? (
                  <button
                    type='button'
                    onClick={() => toggleSort(column)}
                    className='flex items-center gap-1'
                    aria-label={`Sort by ${column.label}`}
                  >
                    {column.label}
                    {params.sort === column.id && params.dir === 'desc' ? (
                      <Icons.chevronDown className='text-primary size-4' />
                    ) : params.sort === column.id ? (
                      <Icons.chevronUp className='text-primary size-4' />
                    ) : (
                      <Icons.chevronDown className='text-muted-foreground size-4' />
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </TableHead>
            ))}
            <TableHead className='w-px' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 2}
                className='text-muted-foreground h-32 text-center'
              >
                {params.search ? `No ${noun.plural} match your search` : `No ${noun.plural}`}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const id = getId(row);
              const isSelected = selected.has(id);
              return (
                <TableRow key={id} data-state={isSelected ? 'selected' : undefined}>
                  <TableCell
                    className={cn('pl-6', isSelected && 'border-l-primary border-l-2 pl-[22px]')}
                  >
                    {canDelete && (
                      <Checkbox
                        aria-label={`Select ${noun.singular}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(id);
                            else next.delete(id);
                            return next;
                          })
                        }
                      />
                    )}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.id}>{column.cell(row)}</TableCell>
                  ))}
                  <TableCell className='pr-6 text-right'>
                    <span className='inline-flex items-center gap-4'>
                      {rowActions?.(row)}
                      {editHref ? (
                        <Link
                          href={editHref(row)}
                          className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
                        >
                          {canEdit ? (
                            <Icons.edit className='size-4' />
                          ) : (
                            <Icons.eye className='size-4' />
                          )}
                          {canEdit ? 'Edit' : 'View'}
                        </Link>
                      ) : canEdit ? (
                        <button
                          type='button'
                          onClick={() => setEditing(row)}
                          className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
                        >
                          <Icons.edit className='size-4' />
                          Edit
                        </button>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3 text-sm'>
        <span>
          {total <= 1
            ? `Showing ${total} result${total === 1 ? '' : 's'}`
            : `Showing ${from} to ${to} of ${total} results`}
        </span>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>Per page</span>
          <Select
            value={String(params.perPage)}
            onValueChange={(v) => setParams({ perPage: Number(v), page: 1 })}
          >
            <SelectTrigger className='w-20' aria-label='Per page'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {pageCount > 1 ? (
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='sm'
              disabled={params.page <= 1}
              onClick={() => setParams({ page: params.page - 1 })}
            >
              Previous
            </Button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pageCount || Math.abs(n - params.page) <= 1)
              .map((n, i, arr) => (
                <span key={n} className='flex items-center gap-1'>
                  {i > 0 && n - arr[i - 1] > 1 && (
                    <span className='text-muted-foreground px-1'>…</span>
                  )}
                  <Button
                    variant={n === params.page ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setParams({ page: n })}
                  >
                    {n}
                  </Button>
                </span>
              ))}
            <Button
              variant='outline'
              size='sm'
              disabled={params.page >= pageCount}
              onClick={() => setParams({ page: params.page + 1 })}
            >
              Next
            </Button>
          </div>
        ) : (
          <span />
        )}
      </div>

      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => bulkDelete.mutate()}
        loading={bulkDelete.isPending}
        title={`Delete ${selected.size === 1 ? `this ${noun.singular}` : `${selected.size} ${noun.plural}`}?`}
        description='This action cannot be undone.'
      />
      {renderEditor?.({
        row: editing,
        open: editing !== null,
        onOpenChange: (open) => !open && setEditing(null)
      })}
    </div>
  );
}
