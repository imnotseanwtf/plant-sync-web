import { cn } from '@/lib/utils';

/** The Plant Sync app icon: a sprout (Plant) inside circular arrows (Sync). */
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

/** Icon + wordmark lockup: "Plant" in the text color, "Sync" in the brand green. */
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
        Plant <span className='text-primary'>Sync</span>
      </span>
    </span>
  );
}
