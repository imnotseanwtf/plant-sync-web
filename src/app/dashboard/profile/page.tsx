import PageContainer from '@/components/layout/page-container';
import { PasswordForm, ProfileForm } from '@/features/profile/components/profile-forms';
import { requireUser } from '@/lib/auth/current-user';
import { USER_TYPE_LABELS } from '@/lib/auth/user-type';

export const metadata = { title: 'Profile' };

/** Any signed-in user can edit their own name, email and password here. */
export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <PageContainer pageTitle='Profile' pageDescription='Your account details and password.'>
      <div className='grid max-w-3xl gap-6'>
        <ProfileForm
          initial={{ name: user.name, email: user.email }}
          roles={user.roles}
          userType={USER_TYPE_LABELS[user.userType]}
        />
        <PasswordForm />
      </div>
    </PageContainer>
  );
}
