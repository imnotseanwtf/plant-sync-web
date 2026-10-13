import { cn } from '@/lib/utils';

/** Simplified emblem (signal arcs + plant) for tight spaces like the collapsed sidebar. */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src='/icon.svg'
      alt='Plant Sync'
      width={304}
      height={304}
      className={cn('aspect-square shrink-0', className)}
    />
  );
}

/**
 * The Plant Sync logo, laid out like the original: "Plant" and "Sync" on either side of the
 * emblem (signal arcs over a growing plant, ringed by crescents).
 */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  const word = cn('font-extrabold tracking-tight', lg ? 'text-5xl' : 'text-xl leading-none');
  return (
    <span className={cn('flex items-end', lg ? 'gap-1' : 'gap-0.5', className)}>
      <span className={cn(word, 'text-[#147200] dark:text-[#4ade80]')}>Plant</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src='/logo-emblem.svg'
        alt=''
        width={320}
        height={348}
        className={cn('shrink-0', lg ? 'h-28 w-auto' : 'h-14 w-auto')}
      />
      <span className={cn(word, 'text-[#0052c0] dark:text-[#60a5fa]')}>Sync</span>
    </span>
  );
}
