import { cn } from '@/lib/utils';

/**
 * The Plant Sync emblem: a rounded pot drawn in one line, with a stem that curls into a spiral
 * and two leaves. Inline SVG so the line follows the text color (light and dark mode).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 120 140'
      fill='none'
      role='img'
      aria-label='Plant Sync'
      className={cn('shrink-0 text-[#0e4f5c] dark:text-[#d9f0ea]', className)}
    >
      <g stroke='currentColor' strokeWidth={7} strokeLinecap='round' strokeLinejoin='round'>
        <path d='M18 46V84A42 42 0 0 0 102 84V62' />
        <path d='M60 126V38C60 18 86 14 89 31C91 45 72 50 68 38C65 29 76 25 80 32' />
      </g>
      <g className='fill-[#43b049] dark:fill-[#5bd36a]'>
        <path d='M60 100C40 100 29 88 28 73C46 72 59 83 60 100Z' />
        <path d='M60 84C61 67 73 57 91 58C91 75 78 86 60 84Z' />
      </g>
    </svg>
  );
}

/** Emblem + a two-line lowercase wordmark ("plant" over "sync"). */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <span className={cn('flex items-center', lg ? 'gap-5' : 'gap-3', className)}>
      <BrandMark className={lg ? 'h-24 w-auto' : 'h-12 w-auto'} />
      <span
        style={{ lineHeight: 0.92 }}
        className={cn(
          'flex flex-col font-[family-name:var(--font-outfit)] font-medium tracking-tight text-[#0e4f5c] lowercase dark:text-[#d9f0ea]',
          lg ? 'text-6xl' : 'text-[26px]'
        )}
      >
        <span>plant</span>
        <span>sync</span>
      </span>
    </span>
  );
}
