'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';

/** Filament's action row: Create / Create & create another / Cancel, or Save changes / Cancel. */
export function FormFooter({
  mode,
  pending,
  cancelHref,
  onCreateAnother
}: {
  mode: 'create' | 'edit';
  pending: boolean;
  cancelHref: string;
  onCreateAnother?: () => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <LoadingButton loading={pending} type='submit'>
        {mode === 'create' ? 'Create' : 'Save changes'}
      </LoadingButton>
      {mode === 'create' && (
        <Button type='button' variant='outline' disabled={pending} onClick={onCreateAnother}>
          Create &amp; create another
        </Button>
      )}
      <Link href={cancelHref} className={buttonVariants({ variant: 'outline' })}>
        Cancel
      </Link>
    </div>
  );
}
