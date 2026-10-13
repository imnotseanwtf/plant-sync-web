import { cn } from '@/lib/utils';

/** The Plant Sync app icon (a sprout with a water drop under a signal arc). */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src='/logo-mark.svg'
      alt='Plant Sync'
      width={128}
      height={128}
      className={cn('aspect-square shrink-0', className)}
    />
  );
}

/** Icon + wordmark lockup. The wordmark uses the app font, so it follows light/dark mode. */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <span className={cn('flex items-center', size === 'lg' ? 'gap-3' : 'gap-2.5', className)}>
      <BrandMark className={size === 'lg' ? 'size-14' : 'size-9'} />
      <span
        className={cn(
          'font-semibold tracking-tight',
          size === 'lg' ? 'text-3xl' : 'text-lg leading-none'
        )}
      >
        Plant Sync
      </span>
    </span>
  );
}
