'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/actions';

export function UserMenu({ name, email }: { name: string; email: string }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon' className='rounded-full' aria-label='User menu' />
        }
      >
        <span className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold'>
          {initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-56'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='font-normal'>
            <div className='truncate text-sm font-medium'>{name}</div>
            <div className='text-muted-foreground truncate text-xs'>{email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => signOut()}>
            <Icons.logout className='mr-2 h-4 w-4' />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
