'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

/** The firmware needs this UUID as `deviceIdentifier`, so make it easy to copy. */
export function CopyId({ value }: { value: string }) {
  return (
    <div className='flex items-center gap-1'>
      <code className='text-muted-foreground text-xs'>{value}</code>
      <Button
        variant='ghost'
        size='icon'
        className='h-6 w-6'
        aria-label='Copy device ID'
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            toast.success('Device ID copied');
          } catch {
            toast.error("Couldn't copy. Select the ID and copy it manually.");
          }
        }}
      >
        <Icons.page className='h-3 w-3' />
      </Button>
    </div>
  );
}
