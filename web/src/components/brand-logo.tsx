import { cn } from '@/lib/utils';

/**
 * The Plant Sync emblem: a P whose stem is a sprout, whose bowl curls into a spiral, with two leaves. Inline SVG so the line follows the text color (light and dark mode).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 92 140'
      fill='none'
      role='img'
      aria-label='P'
      className={cn('shrink-0 text-[#0e4f5c] dark:text-[#d9f0ea]', className)}
    >
      <g stroke='currentColor' strokeWidth={11} strokeLinecap='round' strokeLinejoin='round'>
        <path d='M26 130V22C26 8 54 6 68 19C80 31 72 53 54 55C41 56 35 46 41 40C46 36 53 42 49 47' />
      </g>
      <g className='fill-[#43b049] dark:fill-[#5bd36a]'>
        <path d='M26 112C10 112 3 101 2 88C18 87 26 97 26 112Z' />
        <path d='M26 96C27 80 40 72 58 74C58 91 45 100 26 96Z' />
      </g>
    </svg>
  );
}

/** The emblem stands in for the "P": its stem and curl read as the P of "plant", then "lant" and a small "sync". */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <span
      className={cn(
        'inline-flex flex-col font-[family-name:var(--font-outfit)] font-medium text-[#0e4f5c] dark:text-[#d9f0ea]',
        lg ? 'text-7xl' : 'text-[30px]',
        className
      )}
    >
      <span className='inline-flex items-baseline leading-none tracking-tight'>
        <BrandMark className='h-[1em] w-auto translate-y-[0.1em]' />
        <span className='-ml-[0.02em]'>lant</span>
      </span>
      <span className='mt-[0.16em] pl-[0.95em] text-[0.3em] leading-none tracking-[0.42em] text-[#43b049] uppercase dark:text-[#5bd36a]'>
        sync
      </span>
    </span>
  );
}
