import PageContainer from '@/components/layout/page-container';
import { PlantForm } from '@/features/plants/components/plant-form';

export const metadata = { title: 'Create Plant' };

export default function CreatePlantPage() {
  return (
    <PageContainer
      pageTitle='Create Plant'
      pageDescription='The pump turns on when soil moisture falls to or below the minimum.'
    >
      <PlantForm />
    </PageContainer>
  );
}
