import Link from 'next/link';
import { Icons } from '@/components/icons';

type Crumb = { label: string; href?: string };

/** Filament-style page header: breadcrumb trail, big title, actions on the right. */
export function PageHeader({
  breadcrumbs,
  title,
  actions
}: {
  breadcrumbs?: Crumb[];
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-4 pt-2'>
      <div className='flex flex-col gap-1'>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label='Breadcrumb'
            className='text-muted-foreground flex items-center gap-2 text-sm'
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className='flex items-center gap-2'>
                {i > 0 && <Icons.chevronRight className='size-3.5' />}
                {crumb.href ? (
                  <Link href={crumb.href} className='hover:text-foreground'>
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
      </div>
      {actions && <div className='flex items-center gap-3'>{actions}</div>}
    </div>
  );
}
