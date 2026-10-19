'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { setUserRoleAndRefresh } from '@/features/users/api/mutations';
import type { AppUser } from '@/features/users/api/types';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/auth/rbac';
import { USER_TYPE_LABELS } from '@/lib/auth/user-type';

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

/** Every user with a dropdown to change their role; saves as soon as one is picked. */
export function RoleAssignmentTable({ users }: { users: AppUser[] }) {
  const router = useRouter();
  const change = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => setUserRoleAndRefresh(id, role),
    onSuccess: () => {
      toast.success('Role updated');
      router.refresh();
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <Table>
      <TableHeader className='bg-muted/40'>
        <TableRow>
          <TableHead className='pl-6'>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>User type</TableHead>
          <TableHead className='w-48 pr-6'>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className='text-muted-foreground h-24 text-center'>
              No users
            </TableCell>
          </TableRow>
        ) : (
          users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className='pl-6 font-medium'>{u.name}</TableCell>
              <TableCell className='text-muted-foreground'>{u.email}</TableCell>
              <TableCell>{USER_TYPE_LABELS[u.userType]}</TableCell>
              <TableCell className='pr-6'>
                <Select
                  items={ROLE_OPTIONS}
                  value={u.role}
                  onValueChange={(role) => {
                    if (role && role !== u.role) change.mutate({ id: u.id, role: role as Role });
                  }}
                  disabled={change.isPending}
                >
                  <SelectTrigger aria-label={`Role for ${u.name}`} className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ROLE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
