import PageContainer from '@/components/layout/page-container';
import { getPlantOverview } from '@/features/plants/api/service';
import { PlantDashboard } from '@/features/plants/components/plant-dashboard';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Plant' };

export default async function PlantPage({ params }: { params: Promise<{ plantId: string }> }) {
  const { plantId } = await params;
  const id = Number(plantId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const overview = await getPlantOverview(id);
  if (!overview) notFound();

  return (
    <PageContainer pageTitle={overview.plant.name} pageDescription='Live sensor readings'>
      <PlantDashboard plantId={id} initialData={overview} />
    </PageContainer>
  );
}
