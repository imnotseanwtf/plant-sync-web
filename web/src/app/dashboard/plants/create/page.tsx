import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { PlantForm } from '@/features/plants/components/plant-form';

export const metadata = { title: 'Create Plant' };

export default function CreatePlantPage() {
  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[{ label: 'Plants', href: '/dashboard/plants' }, { label: 'Create' }]}
          title='Create Plant'
        />
        <PlantForm />
      </div>
    </PageContainer>
  );
}
