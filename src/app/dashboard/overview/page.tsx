import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { overviewSummaryQueryOptions } from '@/features/overview/api/queries';
import { PlantOverview } from '@/features/overview/components/plant-overview';
import { requireUser } from '@/lib/auth/current-user';
import { getQueryClient } from '@/lib/query-client';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  await requireUser();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(overviewSummaryQueryOptions());

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Live status of every plant.'>
      <div className='flex flex-col gap-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <PlantOverview />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
