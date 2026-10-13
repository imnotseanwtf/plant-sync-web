'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/loading-button';

/** Filament-style confirmation modal: red icon, title, "Are you sure…", Cancel / Confirm. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description = 'Are you sure you would like to do this?',
  loading,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md text-center'>
        <div className='bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full'>
          <Icons.trash className='size-6' />
        </div>
        <DialogTitle className='text-center'>{title}</DialogTitle>
        <DialogDescription className='text-center'>{description}</DialogDescription>
        <div className='grid grid-cols-2 gap-3 pt-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton loading={loading} variant='destructive' onClick={onConfirm}>
            Confirm
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
