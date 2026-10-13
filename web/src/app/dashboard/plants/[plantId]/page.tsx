import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getPlantOverview } from '@/features/plants/api/service';
import { PlantDetailActions } from '@/features/plants/components/plant-detail-actions';
import { PlantWidgets } from '@/features/plants/components/plant-widgets';
import { SensorValueTable } from '@/features/plants/components/sensor-value-table';

export const metadata = { title: 'Plant' };

/** Live stats, charts and readings for one plant. Editing happens in a side panel. */
export default async function PlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const id = Number(plantId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const overview = await getPlantOverview(id);
  if (!overview) notFound();

  return (
    <PageContainer
      pageTitle={overview.plant.name}
      pageDescription={`Live readings from ${overview.plant.deviceName}`}
      pageHeaderAction={<PlantDetailActions plant={overview.plant} />}
    >
      <div className='flex flex-col gap-4'>
        <PlantWidgets plantId={id} initial={overview} />
        <SensorValueTable plantId={id} initial={overview} />
      </div>
    </PageContainer>
  );
}
