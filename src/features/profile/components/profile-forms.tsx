'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppForm } from '@/lib/form';
import { changePasswordMutation, updateProfileMutation } from '../api/mutations';
import {
  passwordSchema,
  profileSchema,
  type PasswordFormValues,
  type ProfileFormValues
} from '../schemas/profile';

export function ProfileForm({
  initial,
  roles,
  userType
}: {
  initial: ProfileFormValues;
  roles: string[];
  userType: string;
}) {
  const router = useRouter();
  const update = useMutation(updateProfileMutation);

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: profileSchema },
    onSubmit: async ({ value }) => {
      try {
        const saved = await update.mutateAsync(value);
        form.reset(saved);
        toast.success('Profile updated');
        // The sidebar shows the name, which comes from the server.
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your name and the email you sign in with.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='flex flex-col gap-6'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='name'
              children={(field) => <field.TextField label='Name' required autoComplete='name' />}
            />
            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField label='Email' required type='email' autoComplete='email' />
              )}
            />
          </FieldGroup>
          <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
            <span>Roles</span>
            {roles.length === 0 ? (
              <span>none</span>
            ) : (
              roles.map((r) => (
                <Badge key={r} variant='secondary'>
                  {r}
                </Badge>
              ))
            )}
            <span className='ml-2'>Type</span>
            <Badge variant='outline'>{userType}</Badge>
            <span className='basis-full text-xs'>Roles and type are set by an administrator.</span>
          </div>
          <div>
            <LoadingButton type='submit' loading={update.isPending}>
              Save profile
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const emptyPasswords: PasswordFormValues = {
  currentPassword: '',
  password: '',
  passwordConfirmation: ''
};

export function PasswordForm() {
  const change = useMutation(changePasswordMutation);

  const form = useAppForm({
    defaultValues: emptyPasswords,
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      try {
        await change.mutateAsync(value);
        form.reset(emptyPasswords);
        toast.success('Password changed');
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Use at least 8 characters. You stay signed in on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className='flex flex-col gap-6'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='currentPassword'
              children={(field) => (
                <field.TextField
                  label='Current password'
                  required
                  type='password'
                  autoComplete='current-password'
                />
              )}
            />
            <form.AppField
              name='password'
              children={(field) => (
                <field.TextField
                  label='New password'
                  required
                  type='password'
                  autoComplete='new-password'
                />
              )}
            />
            <form.AppField
              name='passwordConfirmation'
              children={(field) => (
                <field.TextField
                  label='Confirm new password'
                  required
                  type='password'
                  autoComplete='new-password'
                />
              )}
            />
          </FieldGroup>
          <div>
            <LoadingButton type='submit' loading={change.isPending}>
              Change password
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
