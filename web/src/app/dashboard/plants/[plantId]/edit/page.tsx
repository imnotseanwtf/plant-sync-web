import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { getPlantOverview } from '@/features/plants/api/service';
import { PlantDeleteButton } from '@/features/plants/components/plant-delete-button';
import { PlantForm } from '@/features/plants/components/plant-form';
import { SensorValueTable } from '@/features/plants/components/sensor-value-table';
import { PlantWidgets } from '@/features/plants/components/plant-widgets';

export const metadata = { title: 'Edit Plant' };

/** Like Filament's EditPlant: stats and charts above the form, the readings table below it. */
export default async function EditPlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const id = Number(plantId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const overview = await getPlantOverview(id);
  if (!overview) notFound();

  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[{ label: 'Plants', href: '/dashboard/plants' }, { label: 'Edit' }]}
          title='Edit Plant'
          actions={<PlantDeleteButton id={id} />}
        />
        <PlantWidgets plantId={id} initial={overview} />
        <PlantForm plant={overview.plant} />
        <SensorValueTable plantId={id} initial={overview} />
      </div>
    </PageContainer>
  );
}
