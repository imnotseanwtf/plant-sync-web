import { cn } from '@/lib/utils';

/**
 * The Plant Sync mark: a green plant-half and a blue water-half interlocked like a yin-yang, each
 * carrying the other's symbol (a water drop in the green, a sprout in the blue).
 */
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

/** Mark + wordmark. "Plant" and "Sync" take the colors of the mark's two halves. */
export function BrandLogo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <span className={cn('flex items-center', lg ? 'gap-4' : 'gap-2.5', className)}>
      <BrandMark className={lg ? 'size-20' : 'size-10'} />
      <span
        className={cn('font-extrabold tracking-tight', lg ? 'text-5xl' : 'text-xl leading-none')}
      >
        <span className='text-[#059669] dark:text-[#34d399]'>Plant</span>{' '}
        <span className='text-[#0284c7] dark:text-[#38bdf8]'>Sync</span>
      </span>
    </span>
  );
}
