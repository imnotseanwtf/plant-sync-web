'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { FormFooter } from '@/components/resource/form-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { AppUser } from '../api/types';
import { createUserSchema, updateUserSchema, type UserFormValues } from '../schemas/user';

const LIST = '/dashboard/users';

export function UserForm({ user }: { user?: AppUser }) {
  const router = useRouter();
  const another = useRef(false);

  const create = useMutation(createUserMutation);
  const update = useMutation(updateUserMutation);

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      passwordConfirmation: ''
    } as UserFormValues,
    validators: {
      onSubmit: (user ? updateUserSchema : createUserSchema) as typeof createUserSchema
    },
    onSubmit: async ({ value }) => {
      try {
        if (user) {
          await update.mutateAsync({ id: user.id, values: value });
          toast.success('Saved');
          form.setFieldValue('password', '');
          form.setFieldValue('passwordConfirmation', '');
        } else {
          const created = await create.mutateAsync(value);
          toast.success('Created');
          if (another.current) form.reset();
          else router.push(`${LIST}/${created.id}/edit`);
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
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='name'
                children={(field) => <field.TextField label='Name' required />}
              />
              <form.AppField
                name='email'
                children={(field) => (
                  <field.TextField label='Email' required type='email' autoComplete='off' />
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
        </CardContent>
      </Card>
      <FormFooter
        mode={user ? 'edit' : 'create'}
        pending={create.isPending || update.isPending}
        cancelHref={LIST}
        onCreateAnother={() => {
          another.current = true;
          form.handleSubmit();
        }}
      />
    </form>
  );
}
