'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { useCan } from '@/components/auth/current-user-provider';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { createRoleMutation, deleteRolesAndRefresh, updateRoleMutation } from '../api/mutations';
import type { RoleRow } from '../api/types';
import { PermissionMatrix } from './permission-matrix';
import { roleSchema, type RoleFormValues } from '../schemas/role';

const FORM_ID = 'role-form-sheet';

export function RoleFormSheet({
  role,
  open,
  onOpenChange
}: {
  role?: RoleRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const canDelete = useCan()('delete:roles');
  const another = useRef(false);
  const create = useMutation(createRoleMutation);
  const update = useMutation(updateRoleMutation);
  const initial: RoleFormValues = {
    name: role?.name ?? '',
    description: role?.description ?? '',
    permissions: role?.permissions ?? []
  };

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: roleSchema },
    onSubmit: async ({ value }) => {
      try {
        if (role) {
          await update.mutateAsync({ id: role.id, values: value });
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

  // Start from the current record every time the panel opens.
  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.name, role?.description, role?.permissions.join(',')]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={role ? 'Edit Role' : 'New Role'}
      description={
        role
          ? 'Changing the permissions applies to everyone who has this role.'
          : 'Name the role and choose what it is allowed to do.'
      }
      formId={FORM_ID}
      mode={role ? 'edit' : 'create'}
      pending={create.isPending || update.isPending}
      onCreateAnother={() => {
        another.current = true;
        form.handleSubmit();
      }}
      onDelete={role && canDelete ? () => deleteRolesAndRefresh([role.id]) : undefined}
      deleteTitle={role ? `Delete ${role.name}? Its users lose these permissions.` : undefined}
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
            children={(field) => <field.TextField label='Name' required placeholder='Technician' />}
          />
          <form.AppField
            name='description'
            children={(field) => (
              <field.TextareaField label='Description' placeholder='What this role is for' />
            )}
          />
          <form.Field
            name='permissions'
            children={(field) => (
              <Field>
                <FieldLabel>Permissions</FieldLabel>
                <FieldDescription>
                  Choose what this role may do with each resource. Create, edit and delete include
                  view.
                </FieldDescription>
                <PermissionMatrix
                  value={field.state.value}
                  onChange={(next) => field.handleChange(next)}
                />
              </Field>
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

export function RoleFormSheetTrigger() {
  const canCreate = useCan()('create:roles');
  const [open, setOpen] = useState(false);
  if (!canCreate) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New role
      </Button>
      <RoleFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
