'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './confirm-dialog';

/** Red "Delete" header action on edit pages, with Filament's confirmation modal. */
export function DeleteRecordButton({
  title,
  onDelete,
  redirectTo
}: {
  /** e.g. `Delete Plant` */
  title: string;
  onDelete: () => Promise<unknown>;
  redirectTo: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: onDelete,
    onSuccess: () => {
      toast.success('Deleted');
      router.push(redirectTo);
    },
    onError: (e) => {
      toast.error(e.message);
      setOpen(false);
    }
  });

  return (
    <>
      <Button variant='destructive' onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    </>
  );
}
