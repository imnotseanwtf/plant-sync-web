import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { AppUser } from '@/features/users/api/types';
import {
  can,
  PERMISSIONS,
  PERMISSION_LABELS,
  permissionsOf,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS
} from '@/lib/auth/rbac';
import { RoleAssignmentTable } from './role-assignment-table';

/** Roles, what each can do, and who has which. Permissions live in code (src/lib/auth/rbac.ts). */
export function RolesOverview({ users }: { users: AppUser[] }) {
  const count = (role: (typeof ROLES)[number]) => users.filter((u) => u.role === role).length;

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                {ROLE_LABELS[role]}
                <Badge variant='secondary'>
                  {count(role)} {count(role) === 1 ? 'user' : 'users'}
                </Badge>
              </CardTitle>
              <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-3'>
              <ul className='text-sm'>
                <li className='flex items-center gap-2'>
                  <Icons.circleCheck className='size-4 text-emerald-600' />
                  View the dashboard, plants and devices
                </li>
                {permissionsOf(role).map((p) => (
                  <li key={p} className='flex items-center gap-2'>
                    <Icons.circleCheck className='size-4 text-emerald-600' />
                    {PERMISSION_LABELS[p]}
                  </li>
                ))}
              </ul>
              <Link
                href={`/dashboard/users?f_role=${role}`}
                className='text-primary text-sm font-medium hover:underline'
              >
                View {ROLE_LABELS[role].toLowerCase()} users
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className='overflow-hidden p-0'>
        <CardHeader className='p-6 pb-3'>
          <CardTitle>Permission matrix</CardTitle>
          <CardDescription>
            What each role is allowed to do. Server actions enforce these, and the interface hides
            what a role can’t use.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow>
              <TableHead className='pl-6'>Permission</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role} className='text-center'>
                  {ROLE_LABELS[role]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { key: 'read', label: 'View the dashboard, plants and devices', allowed: () => true },
              ...PERMISSIONS.map((p) => ({
                key: p,
                label: PERMISSION_LABELS[p],
                allowed: (role: (typeof ROLES)[number]) => can(role, p)
              }))
            ].map((row) => (
              <TableRow key={row.key}>
                <TableCell className='pl-6'>{row.label}</TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} className='text-center'>
                    {row.allowed(role) ? (
                      <Icons.circleCheck
                        className='mx-auto size-5 text-emerald-600'
                        aria-label='Allowed'
                      />
                    ) : (
                      <Icons.circleX
                        className='text-muted-foreground/60 mx-auto size-5'
                        aria-label='Not allowed'
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className='overflow-hidden p-0'>
        <CardHeader className='p-6 pb-3'>
          <CardTitle>Assign roles</CardTitle>
          <CardDescription>
            Pick a role to change it right away. There always has to be at least one admin.
          </CardDescription>
        </CardHeader>
        <RoleAssignmentTable users={users} />
      </Card>
    </div>
  );
}
