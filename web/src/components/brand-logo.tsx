import { cn } from '@/lib/utils';

/**
 * The Plant Sync emblem is the letter "P" of "plant", drawn as one rounded line: the stem is a
 * sprout, the bowl is a pot-round loop, and two leaves grow inside the counter. Inline SVG so the
 * line follows the text color (light and dark mode).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 72 100'
      fill='none'
      role='img'
      aria-label='P'
      className={cn('shrink-0 text-[#0e4f5c] dark:text-[#d9f0ea]', className)}
    >
      <g stroke='currentColor' strokeWidth={10} strokeLinecap='round' strokeLinejoin='round'>
        <path d='M16 96V5H38C54 5 66 17 66 34C66 51 54 63 38 63H16' />
      </g>
      <g className='fill-[#43b049] dark:fill-[#5bd36a]'>
        <path d='M33 50C22 48 18 38 20 27C31 27 38 35 33 50Z' />
        <path d='M36 46C37 35 44 27 55 27C56 38 49 46 36 46Z' />
      </g>
    </svg>
  );
}

/** "P" emblem + "lant" so it reads "plant", with a small "sync" tag underneath. */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <span
      className={cn(
        'inline-flex flex-col font-[family-name:var(--font-outfit)] font-medium text-[#0e4f5c] dark:text-[#d9f0ea]',
        lg ? 'text-7xl' : 'text-[34px]',
        className
      )}
    >
      <span className='inline-flex items-baseline leading-none tracking-tight'>
        <BrandMark className='h-[0.72em] w-auto' />
        <span className='-ml-[0.02em]'>lant</span>
      </span>
      <span className='mt-[0.08em] pl-[0.5em] text-[0.3em] leading-none tracking-[0.42em] text-[#43b049] uppercase dark:text-[#5bd36a]'>
        sync
      </span>
    </span>
  );
}
