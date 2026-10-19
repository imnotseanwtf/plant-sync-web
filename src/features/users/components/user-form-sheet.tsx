'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { roleOptionsQueryOptions } from '@/features/roles/api/queries';
import { USER_TYPES, USER_TYPE_LABELS } from '@/lib/auth/user-type';
import { useAppForm } from '@/lib/form';
import { createUserMutation, deleteUsersAndRefresh, updateUserMutation } from '../api/mutations';
import type { AppUser } from '../api/types';
import { createUserSchema, updateUserSchema, type UserFormValues } from '../schemas/user';

const FORM_ID = 'user-form-sheet';

export function UserFormSheet({
  user,
  open,
  onOpenChange
}: {
  user?: AppUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
          onOpenChange(false);
        } else {
          await create.mutateAsync(value);
          toast.success('Created');
          if (another.current) form.reset(initial);
          else onOpenChange(false);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.name, user?.email, user?.roles.map((r) => r.id).join(','), user?.userType]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={user ? 'Edit User' : 'New User'}
      description={
        user
          ? 'Update the user details. Leave the password empty to keep it.'
          : 'Create a user who can sign in to the dashboard.'
      }
      formId={FORM_ID}
      mode={user ? 'edit' : 'create'}
      pending={create.isPending || update.isPending}
      onCreateAnother={() => {
        another.current = true;
        form.handleSubmit();
      }}
      onDelete={user ? () => deleteUsersAndRefresh([user.id]) : undefined}
      deleteTitle={user ? `Delete ${user.name}?` : undefined}
    >
      <form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          another.current = false;
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.AppField
            name='name'
            children={(field) => <field.TextField label='Name' required placeholder='Jane Doe' />}
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
                description='What kind of user this is. It does not change what they are allowed to do; the role does.'
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
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New user
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
