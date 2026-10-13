'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { FormFooter } from '@/components/resource/form-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/lib/form';
import { createDeviceMutation, updateDeviceMutation } from '../api/mutations';
import type { Device } from '../api/types';
import { deviceSchema } from '../schemas/device';

const LIST = '/dashboard/device-identifiers';

export function DeviceForm({ device }: { device?: Device }) {
  const router = useRouter();
  const another = useRef(false);

  const create = useMutation(createDeviceMutation);
  const update = useMutation(updateDeviceMutation);

  const form = useAppForm({
    defaultValues: { name: device?.name ?? '' },
    validators: { onSubmit: deviceSchema },
    onSubmit: async ({ value }) => {
      try {
        if (device) {
          await update.mutateAsync({ id: device.id, values: value });
          toast.success('Saved');
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
          <CardTitle>Device Identifier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {device && (
              <Field>
                <FieldLabel htmlFor='device-id'>ID</FieldLabel>
                <Input id='device-id' value={device.id} disabled readOnly />
              </Field>
            )}
            <form.AppField
              name='name'
              children={(field) => <field.TextField label='Name' required />}
            />
          </FieldGroup>
        </CardContent>
      </Card>
      <FormFooter
        mode={device ? 'edit' : 'create'}
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
