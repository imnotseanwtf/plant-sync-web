import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getRole } from '@/features/roles/api/service';
import { RoleDeleteButton, RoleForm } from '@/features/roles/components/role-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'Edit Role' };

export default async function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  await requirePagePermission('view:roles');
  const { roleId } = await params;
  const role = await getRole(Number(roleId));
  if (!role) notFound();

  return (
    <PageContainer
      pageTitle={`Edit Role: ${role.name}`}
      pageDescription='Changing the permissions applies to everyone who has this role.'
      pageHeaderAction={<RoleDeleteButton role={role} />}
    >
      <RoleForm role={role} />
    </PageContainer>
  );
}
