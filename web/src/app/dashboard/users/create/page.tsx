import PageContainer from '@/components/layout/page-container';
import { PageHeader } from '@/components/resource/page-header';
import { UserForm } from '@/features/users/components/user-form';

export const metadata = { title: 'Create User' };

export default function CreateUserPage() {
  return (
    <PageContainer>
      <div className='flex flex-col gap-6'>
        <PageHeader
          breadcrumbs={[{ label: 'Users', href: '/dashboard/users' }, { label: 'Create' }]}
          title='Create User'
        />
        <UserForm />
      </div>
    </PageContainer>
  );
}
