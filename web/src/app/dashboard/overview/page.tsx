import PageContainer from '@/components/layout/page-container';
import { getDashboardSummary } from '@/features/overview/api/service';
import { PlantOverview } from '@/features/overview/components/plant-overview';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const summary = await getDashboardSummary();

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Live status of every plant.'>
      <PlantOverview summary={summary} />
    </PageContainer>
  );
}
