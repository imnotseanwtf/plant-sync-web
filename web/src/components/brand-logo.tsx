import { cn } from '@/lib/utils';

/** The full Plant Sync logo. The artwork has dark text, so it sits on a white chip in dark mode. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src='/logo.png'
      alt='Plant Sync'
      width={480}
      height={221}
      className={cn('w-auto dark:rounded-md dark:bg-white dark:p-1', className)}
    />
  );
}

/** Just the emblem (Wi-Fi sprout + water drop), for tight spaces like the collapsed sidebar. */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src='/logo-mark.svg' alt='Plant Sync' className={cn('aspect-square', className)} />
  );
}
