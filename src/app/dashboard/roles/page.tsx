import PageContainer from '@/components/layout/page-container';
import { getRoleOverview } from '@/features/roles/api/service';
import { RolesOverview } from '@/features/roles/components/roles-overview';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'Roles & Permissions' };

export default async function RolesPage() {
  await requirePagePermission('users:manage');
  const users = await getRoleOverview();

  return (
    <PageContainer
      pageTitle='Roles & Permissions'
      pageDescription='What each role can do, and who has which role.'
    >
      <RolesOverview users={users} />
    </PageContainer>
  );
}
