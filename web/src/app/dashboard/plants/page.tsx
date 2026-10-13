import PageContainer from '@/components/layout/page-container';
import PlantListingPage from '@/features/plants/components/plant-listing';
import { PlantFormSheetTrigger } from '@/features/plants/components/plant-form-sheet';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = { title: 'Plants' };

export default async function PlantsPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Plants'
      pageDescription='Irrigation targets for each plant. Click a plant to see live readings.'
      pageHeaderAction={<PlantFormSheetTrigger />}
    >
      <PlantListingPage />
    </PageContainer>
  );
}
