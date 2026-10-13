import type { SearchParams } from 'nuqs/server';
import PageContainer from '@/components/layout/page-container';
import PlantListing from '@/features/plants/components/plant-listing';
import { PlantFormSheetTrigger } from '@/features/plants/components/plant-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';

export const metadata = { title: 'Plants' };

export default async function PlantsPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Plants'
      pageDescription='Irrigation targets for each plant.'
      pageHeaderAction={<PlantFormSheetTrigger />}
    >
      <PlantListing />
    </PageContainer>
  );
}
