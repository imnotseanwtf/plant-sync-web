import PageContainer from '@/components/layout/page-container';
import { UserForm } from '@/features/users/components/user-form';

export const metadata = { title: 'Create User' };

export default function CreateUserPage() {
  return (
    <PageContainer
      pageTitle='Create User'
      pageDescription='Create a user who can sign in to the dashboard.'
    >
      <UserForm />
    </PageContainer>
  );
}
