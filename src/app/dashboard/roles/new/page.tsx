import PageContainer from '@/components/layout/page-container';
import { RoleForm } from '@/features/roles/components/role-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'New Role' };

export default async function NewRolePage() {
  await requirePagePermission('create:roles');
  return (
    <PageContainer
      pageTitle='New Role'
      pageDescription='Name the role and choose what it is allowed to do.'
    >
      <RoleForm />
    </PageContainer>
  );
}
