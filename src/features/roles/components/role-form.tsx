'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/auth/current-user-provider';
import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { FormFooter } from '@/components/resource/form-footer';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import Link from 'next/link';
import { createRoleMutation, deleteRolesAndRefresh, updateRoleMutation } from '../api/mutations';
import type { RoleRow } from '../api/types';
import { roleSchema, type RoleFormValues } from '../schemas/role';
import { PermissionMatrix } from './permission-matrix';

const LIST = '/dashboard/roles';

/** Create (no `role`) or edit a role on its own page. */
export function RoleForm({ role }: { role?: RoleRow }) {
  const router = useRouter();
  const canEdit = useCan()(role ? 'edit:roles' : 'create:roles');
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
          <CardTitle>Role details</CardTitle>
        </CardHeader>
        <CardContent>
          <fieldset disabled={!canEdit} className='contents'>
            <FieldGroup>
              <form.AppField
                name='name'
                children={(field) => (
                  <field.TextField label='Name' required placeholder='Technician' />
                )}
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
                      Choose what this role may do with each resource. Create, edit and delete
                      include view.
                    </FieldDescription>
                    <PermissionMatrix
                      value={field.state.value}
                      onChange={(next) => field.handleChange(next)}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </fieldset>
        </CardContent>
      </Card>
      {canEdit ? (
        <FormFooter
          mode={role ? 'edit' : 'create'}
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

export function RoleDeleteButton({ role }: { role: RoleRow }) {
  if (!useCan()('delete:roles')) return null;
  return (
    <DeleteRecordButton
      title={`Delete ${role.name}? Its users lose these permissions.`}
      onDelete={() => deleteRolesAndRefresh([role.id])}
      redirectTo={LIST}
    />
  );
}
