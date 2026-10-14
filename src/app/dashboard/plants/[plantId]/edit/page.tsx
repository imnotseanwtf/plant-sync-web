import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getPlantOverview } from '@/features/plants/api/service';
import { PlantDeleteButton } from '@/features/plants/components/plant-delete-button';
import { PlantForm } from '@/features/plants/components/plant-form';
import { PlantWidgets } from '@/features/plants/components/plant-widgets';
import { SensorValueTable } from '@/features/plants/components/sensor-value-table';

export const metadata = { title: 'Edit Plant' };

/** Stats and charts above the form, the live readings table below it. */
export default async function EditPlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const id = Number(plantId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const overview = await getPlantOverview(id);
  if (!overview) notFound();

  return (
    <PageContainer
      pageTitle='Edit Plant'
      pageDescription='Live readings and irrigation targets.'
      pageHeaderAction={<PlantDeleteButton id={id} />}
    >
      <div className='flex flex-col gap-4'>
        <PlantWidgets plantId={id} initial={overview} />
        <PlantForm plant={overview.plant} />
        <SensorValueTable plantId={id} initial={overview} />
      </div>
    </PageContainer>
  );
}
