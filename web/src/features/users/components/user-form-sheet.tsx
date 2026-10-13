'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useAppForm } from '@/lib/form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createUserMutation, updateUserMutation } from '../api/mutations';
import type { AppUser } from '../api/types';
import { createUserSchema, updateUserSchema, type UserFormValues } from '../schemas/user';

interface UserFormSheetProps {
  user?: AppUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserFormSheet({ user, open, onOpenChange }: UserFormSheetProps) {
  const isEdit = !!user;

  const createMutation = useMutation({
    ...createUserMutation,
    onSuccess: () => {
      toast.success('User created');
      onOpenChange(false);
      form.reset();
    },
    onError: (e) => toast.error(e.message)
  });

  const updateMutation = useMutation({
    ...updateUserMutation,
    onSuccess: () => {
      toast.success('User updated');
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message)
  });

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: ''
    } as UserFormValues,
    validators: {
      onSubmit: (isEdit ? updateUserSchema : createUserSchema) as typeof createUserSchema
    },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: user.id, values: value });
      } else {
        await createMutation.mutateAsync(value);
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit User' : 'New User'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the user details. Leave the password empty to keep it.'
              : 'Create a user who can sign in to the dashboard.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='user-form-sheet'
            className='space-y-4 p-4'
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
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
                  />
                )}
              />
              <form.AppField
                name='password'
                children={(field) => (
                  <field.TextField
                    label={isEdit ? 'New password' : 'Password'}
                    required={!isEdit}
                    type='password'
                    autoComplete='new-password'
                    description='At least 8 characters.'
                  />
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton loading={isPending} type='submit' form='user-form-sheet'>
            {isEdit ? 'Update User' : 'Create User'}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function UserFormSheetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> Add User
      </Button>
      <UserFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
