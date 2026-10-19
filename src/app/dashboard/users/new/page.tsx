import PageContainer from '@/components/layout/page-container';
import { UserForm } from '@/features/users/components/user-form';
import { requirePagePermission } from '@/lib/auth/current-user';

export const metadata = { title: 'New User' };

export default async function NewUserPage() {
  await requirePagePermission('create:users');
  return (
    <PageContainer
      pageTitle='New User'
      pageDescription='Create a user who can sign in to the dashboard.'
    >
      <UserForm />
    </PageContainer>
  );
}
