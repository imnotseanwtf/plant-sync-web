import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import PlantListing from '@/features/plants/components/plant-listing';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Plants' };

export default async function PlantsPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Plants'
      pageDescription='Irrigation targets for each plant.'
      pageHeaderAction={
        <Link href='/dashboard/plants/create' className={buttonVariants()}>
          <Icons.add className='mr-2 h-4 w-4' /> New plant
        </Link>
      }
    >
      <PlantListing />
    </PageContainer>
  );
}
