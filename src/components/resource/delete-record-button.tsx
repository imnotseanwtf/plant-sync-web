'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';

/** "Delete" header action on edit pages, with the starter's confirmation modal. */
export function DeleteRecordButton({
  title,
  onDelete,
  redirectTo
}: {
  /** e.g. `Delete this plant?` */
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
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => mutation.mutate()}
        loading={mutation.isPending}
        title={title}
        description='This action cannot be undone.'
      />
    </>
  );
}
