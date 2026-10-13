'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

/** Per-row "Edit / Delete" menu, same pattern as the starter's table cell actions. */
export function RowActions({
  editHref,
  title,
  onDelete
}: {
  editHref: string;
  /** Shown in the delete confirmation, e.g. `Delete plant?` */
  title: string;
  onDelete: () => Promise<unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      toast.success('Deleted');
      setOpen(false);
    },
    onError: (e) => toast.error(e.message)
  });

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => mutation.mutate()}
        loading={mutation.isPending}
        title={title}
        description='This action cannot be undone.'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' className='h-8 w-8 p-0' />}>
          <span className='sr-only'>Open menu</span>
          <Icons.ellipsis className='h-4 w-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(editHref)}>
              <Icons.edit className='mr-2 h-4 w-4' /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <Icons.trash className='mr-2 h-4 w-4' /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
