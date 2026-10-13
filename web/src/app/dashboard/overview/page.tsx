import PageContainer from '@/components/layout/page-container';
import { getDashboardSummary } from '@/features/overview/api/service';
import { AccountWidget } from '@/features/overview/components/account-widget';
import { PlantOverview } from '@/features/overview/components/plant-overview';
import { requireUser } from '@/lib/auth/current-user';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const user = await requireUser();
  const summary = await getDashboardSummary();

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Live status of every plant.'>
      <div className='flex flex-col gap-4'>
        <AccountWidget name={user.name} />
        <PlantOverview summary={summary} />
      </div>
    </PageContainer>
  );
}
