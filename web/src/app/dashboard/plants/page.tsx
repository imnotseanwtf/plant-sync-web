import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { buttonVariants } from '@/components/ui/button';
import PlantListing from '@/features/plants/components/plant-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Plants' };

export default async function PlantsPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[{ label: 'Plants', href: '/dashboard/plants' }, { label: 'List' }]}
          title='Plants'
          actions={
            <Link href='/dashboard/plants/create' className={buttonVariants()}>
              New plant
            </Link>
          }
        />
        <PlantListing />
      </div>
    </PageContainer>
  );
}
