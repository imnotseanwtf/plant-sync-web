'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ACTIONS,
  ACTION_LABELS,
  PERMISSIONS,
  RESOURCES,
  RESOURCE_LABELS,
  permission,
  type Action,
  type Permission,
  type Resource
} from '@/lib/auth/rbac';

const HINTS: Record<Resource, string> = {
  plants: 'Plants and their readings',
  devices: 'Device identifiers and wiring',
  users: 'People who sign in',
  roles: 'Roles and what they allow'
};

/**
 * Permissions as a grid: a row per resource, a column per action. Ticking create, edit or delete
 * also ticks view (you can't change what you can't see), and unticking view clears the rest.
 */
export function PermissionMatrix({
  value,
  onChange
}: {
  value: readonly Permission[];
  onChange: (next: Permission[]) => void;
}) {
  const has = (r: Resource, a: Action) => value.includes(permission(a, r));
  const emit = (set: Set<Permission>) => onChange(PERMISSIONS.filter((p) => set.has(p)));

  function toggle(r: Resource, a: Action, checked: boolean) {
    const next = new Set(value);
    if (a === 'view') {
      if (checked) next.add(permission('view', r));
      else ACTIONS.forEach((x) => next.delete(permission(x, r)));
    } else if (checked) {
      next.add(permission(a, r));
      next.add(permission('view', r));
    } else {
      next.delete(permission(a, r));
    }
    emit(next);
  }

  function toggleRow(r: Resource, checked: boolean) {
    const next = new Set(value);
    ACTIONS.forEach((a) => (checked ? next.add(permission(a, r)) : next.delete(permission(a, r))));
    emit(next);
  }

  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader className='bg-muted/40'>
          <TableRow>
            <TableHead className='pl-3'>Resource</TableHead>
            {ACTIONS.map((a) => (
              <TableHead key={a} className='px-1 text-center'>
                {ACTION_LABELS[a]}
              </TableHead>
            ))}
            <TableHead className='px-1 pr-3 text-center'>All</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RESOURCES.map((r) => (
            <TableRow key={r}>
              <TableCell className='pl-3 font-medium' title={HINTS[r]}>
                {RESOURCE_LABELS[r]}
              </TableCell>
              {ACTIONS.map((a) => (
                <TableCell key={a} className='px-1 text-center'>
                  <Checkbox
                    aria-label={`${ACTION_LABELS[a]} ${RESOURCE_LABELS[r].toLowerCase()}`}
                    checked={has(r, a)}
                    onCheckedChange={(checked) => toggle(r, a, !!checked)}
                  />
                </TableCell>
              ))}
              <TableCell className='px-1 pr-3 text-center'>
                <Checkbox
                  aria-label={`All permissions for ${RESOURCE_LABELS[r].toLowerCase()}`}
                  checked={ACTIONS.every((a) => has(r, a))}
                  onCheckedChange={(checked) => toggleRow(r, !!checked)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
