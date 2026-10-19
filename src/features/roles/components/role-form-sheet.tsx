'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { PERMISSIONS, PERMISSION_LABELS } from '@/lib/auth/rbac';
import { useAppForm } from '@/lib/form';
import { createRoleMutation, deleteRolesAndRefresh, updateRoleMutation } from '../api/mutations';
import type { RoleRow } from '../api/types';
import { roleSchema, type RoleFormValues } from '../schemas/role';

const FORM_ID = 'role-form-sheet';
const PERMISSION_OPTIONS = PERMISSIONS.map((p) => ({ value: p, label: PERMISSION_LABELS[p] }));

export function RoleFormSheet({
  role,
  open,
  onOpenChange
}: {
  role?: RoleRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
      onDelete={role ? () => deleteRolesAndRefresh([role.id]) : undefined}
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
          <form.AppField
            name='permissions'
            mode='array'
            children={(field) => (
              <field.CheckboxGroupField
                label='Permissions'
                description='Everyone can view the dashboard, plants and devices. Tick what this role may also change.'
                options={PERMISSION_OPTIONS}
              />
            )}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

export function RoleFormSheetTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New role
      </Button>
      <RoleFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
