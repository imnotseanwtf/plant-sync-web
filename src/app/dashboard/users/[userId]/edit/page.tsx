import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getUser } from '@/features/users/api/service';
import { UserDeleteButton, UserForm } from '@/features/users/components/user-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'Edit User' };

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  await requirePagePermission('view:users');
  const { userId } = await params;
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <PageContainer
      pageTitle={`Edit User: ${user.name}`}
      pageDescription='Update the user details. Leave the password empty to keep it.'
      pageHeaderAction={<UserDeleteButton user={user} />}
    >
      <UserForm user={user} />
    </PageContainer>
  );
}
