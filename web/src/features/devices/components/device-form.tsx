'use client';

import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Fieldset } from '@/components/resource/fieldset';
import { FormFooter } from '@/components/resource/form-footer';
import { FormInput, ReadOnlyInput } from '@/components/resource/form-controls';
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
      className='flex flex-col gap-6'
      onSubmit={(e) => {
        e.preventDefault();
        another.current = false;
        form.handleSubmit();
      }}
    >
      <Fieldset legend='Device Identifier Details'>
        {device && <ReadOnlyInput label='Id' value={device.id} className='md:col-span-2' />}
        <form.Field name='name'>
          {(field) => <FormInput field={field} label='Name' required className='md:col-span-2' />}
        </form.Field>
      </Fieldset>
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
