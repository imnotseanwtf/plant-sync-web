'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/auth/current-user-provider';
import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { FormFooter } from '@/components/resource/form-footer';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { roleOptionsQueryOptions } from '@/features/roles/api/queries';
import { USER_TYPES, USER_TYPE_LABELS } from '@/lib/auth/user-type';
import { useAppForm } from '@/lib/form';
import { createUserMutation, deleteUsersAndRefresh, updateUserMutation } from '../api/mutations';
import type { AppUser } from '../api/types';
import { createUserSchema, updateUserSchema, type UserFormValues } from '../schemas/user';

const LIST = '/dashboard/users';

/** Create (no `user`) or edit a user on its own page. */
export function UserForm({ user }: { user?: AppUser }) {
  const router = useRouter();
  const canEdit = useCan()(user ? 'edit:users' : 'create:users');
  const another = useRef(false);
  const roleOptions = useQuery(roleOptionsQueryOptions());
  const create = useMutation(createUserMutation);
  const update = useMutation(updateUserMutation);
  const initial: UserFormValues = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    roleIds: user?.roles.map((r) => String(r.id)) ?? [],
    userType: user?.userType ?? 'farmer',
    password: '',
    passwordConfirmation: ''
  };

  const form = useAppForm({
    defaultValues: initial,
    validators: {
      onSubmit: (user ? updateUserSchema : createUserSchema) as typeof createUserSchema
    },
    onSubmit: async ({ value }) => {
      try {
        if (user) {
          await update.mutateAsync({ id: user.id, values: value });
          toast.success('Saved');
          router.push(LIST);
        } else {
          await create.mutateAsync(value);
          toast.success('Created');
          if (another.current) form.reset(initial);
          else router.push(LIST);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        another.current = false;
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>User details</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset disabled={!canEdit} className='contents'>
            <FieldGroup>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <form.AppField
                  name='name'
                  children={(field) => (
                    <field.TextField label='Name' required placeholder='Jane Doe' />
                  )}
                />
                <form.AppField
                  name='email'
                  children={(field) => (
                    <field.TextField
                      label='Email'
                      required
                      type='email'
                      placeholder='jane@example.com'
                      autoComplete='off'
                    />
                  )}
                />
                <form.AppField
                  name='userType'
                  children={(field) => (
                    <field.SelectField
                      label='User type'
                      required
                      options={USER_TYPES.map((t) => ({ value: t, label: USER_TYPE_LABELS[t] }))}
                      description='What kind of user this is. It does not change what they are allowed to do; the roles do.'
                    />
                  )}
                />
                <form.AppField
                  name='roleIds'
                  mode='array'
                  children={(field) => (
                    <field.MultiSelectField
                      label='Roles'
                      required
                      placeholder='Select roles…'
                      emptyMessage='No roles found.'
                      description='A user can have several roles and gets the permissions of all of them.'
                      options={roleOptions.data ?? []}
                    />
                  )}
                />
                <form.AppField
                  name='password'
                  children={(field) => (
                    <field.TextField
                      label={user ? 'New password' : 'Password'}
                      required={!user}
                      type='password'
                      autoComplete='new-password'
                      description={user ? 'Leave empty to keep the current password.' : undefined}
                    />
                  )}
                />
                <form.AppField
                  name='passwordConfirmation'
                  children={(field) => (
                    <field.TextField
                      label='Confirm password'
                      required={!user}
                      type='password'
                      autoComplete='new-password'
                    />
                  )}
                />
              </div>
            </FieldGroup>
          </fieldset>
        </CardContent>
      </Card>
      {canEdit ? (
        <FormFooter
          mode={user ? 'edit' : 'create'}
          pending={create.isPending || update.isPending}
          cancelHref={LIST}
          onCreateAnother={() => {
            another.current = true;
            form.handleSubmit();
          }}
        />
      ) : (
        <div>
          <Link href={LIST} className={buttonVariants({ variant: 'outline' })}>
            Back
          </Link>
        </div>
      )}
    </form>
  );
}

export function UserDeleteButton({ user }: { user: AppUser }) {
  if (!useCan()('delete:users')) return null;
  return (
    <DeleteRecordButton
      title={`Delete ${user.name}?`}
      onDelete={() => deleteUsersAndRefresh([user.id])}
      redirectTo={LIST}
    />
  );
}
