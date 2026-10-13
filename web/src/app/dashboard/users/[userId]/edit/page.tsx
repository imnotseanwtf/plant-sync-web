import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { getUser } from '@/features/users/api/service';
import { UserDeleteButton } from '@/features/users/components/user-delete-button';
import { UserForm } from '@/features/users/components/user-form';

export const metadata = { title: 'Edit User' };

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const user = await getUser(id);
  if (!user) notFound();

  return (
    <PageContainer
      pageTitle='Edit User'
      pageDescription='Update the user details.'
      pageHeaderAction={<UserDeleteButton id={user.id} />}
    >
      <UserForm user={user} />
    </PageContainer>
  );
}
