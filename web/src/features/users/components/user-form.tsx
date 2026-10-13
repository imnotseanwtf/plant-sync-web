'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Fieldset } from '@/components/resource/fieldset';
import { FormFooter } from '@/components/resource/form-footer';
import { FormInput } from '@/components/resource/form-controls';
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
      className='flex flex-col gap-6'
      onSubmit={(e) => {
        e.preventDefault();
        another.current = false;
        form.handleSubmit();
      }}
    >
      <Fieldset legend='User Information'>
        <form.Field name='name'>
          {(field) => <FormInput field={field} label='Name' required />}
        </form.Field>
        <form.Field name='email'>
          {(field) => (
            <FormInput field={field} label='Email' type='email' required autoComplete='off' />
          )}
        </form.Field>
        <form.Field name='password'>
          {(field) => (
            <FormInput
              field={field}
              label='Password'
              type='password'
              required={!user}
              autoComplete='new-password'
              placeholder={user ? 'Leave empty to keep the current password' : undefined}
            />
          )}
        </form.Field>
        <form.Field name='passwordConfirmation'>
          {(field) => (
            <FormInput
              field={field}
              label='Confirm Password'
              type='password'
              required={!user}
              autoComplete='new-password'
            />
          )}
        </form.Field>
      </Fieldset>
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
