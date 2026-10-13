'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

/**
 * Side panel shell shared by every create/edit form: title, scrollable body (the `<form id>` goes
 * in `children`), and Cancel / "Create & create another" / submit buttons in the footer.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  formId,
  mode,
  pending,
  onCreateAnother,
  onDelete,
  onDeleted,
  deleteTitle,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formId: string;
  mode: 'create' | 'edit';
  pending: boolean;
  onCreateAnother?: () => void;
  /** Edit mode only: shows a red Delete button that asks for confirmation first. */
  onDelete?: () => Promise<unknown>;
  onDeleted?: () => void;
  deleteTitle?: string;
  children: React.ReactNode;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remove = useMutation({
    mutationFn: async () => onDelete?.(),
    onSuccess: () => {
      toast.success('Deleted');
      setConfirmOpen(false);
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirmOpen(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto p-4'>{children}</div>
        <SheetFooter className='sm:flex-col'>
          <LoadingButton loading={pending} type='submit' form={formId}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </LoadingButton>
          {mode === 'create' && (
            <Button type='button' variant='outline' disabled={pending} onClick={onCreateAnother}>
              Create &amp; create another
            </Button>
          )}
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {mode === 'edit' && onDelete && (
            <Button type='button' variant='destructive' onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          )}
        </SheetFooter>
        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => remove.mutate()}
          loading={remove.isPending}
          title={deleteTitle ?? 'Delete this record?'}
          description='This action cannot be undone.'
        />
      </SheetContent>
    </Sheet>
  );
}
