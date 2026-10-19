'use client';

import Link from 'next/link';
import { useCan } from '@/components/auth/current-user-provider';
import { Icons } from '@/components/icons';
import { buttonVariants } from '@/components/ui/button';
import type { Permission } from '@/lib/auth/rbac';

/** The "New …" button above a table: a link to the create page, shown only with `permission`. */
export function CreateLink({
  href,
  label,
  permission
}: {
  href: string;
  label: string;
  permission: Permission;
}) {
  if (!useCan()(permission)) return null;
  return (
    <Link href={href} className={buttonVariants()}>
      <Icons.add className='mr-2 h-4 w-4' /> {label}
    </Link>
  );
}
