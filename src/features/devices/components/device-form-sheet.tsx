'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/auth/current-user-provider';
import { Icons } from '@/components/icons';
import { FormSheet } from '@/components/resource/form-sheet';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/lib/form';
import {
  createDeviceMutation,
  deleteDevicesAndRefresh,
  updateDeviceMutation
} from '../api/mutations';
import type { Device } from '../api/types';
import { deviceSchema } from '../schemas/device';

const FORM_ID = 'device-form-sheet';

export function DeviceFormSheet({
  device,
  open,
  onOpenChange
}: {
  device?: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const another = useRef(false);
  const create = useMutation(createDeviceMutation);
  const update = useMutation(updateDeviceMutation);
  const initial = { name: device?.name ?? '' };

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: deviceSchema },
    onSubmit: async ({ value }) => {
      try {
        if (device) {
          await update.mutateAsync({ id: device.id, values: value });
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
  }, [open, device?.name]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={device ? 'Edit Device Identifier' : 'New Device Identifier'}
      description={
        device
          ? 'Renaming keeps the ID, so the firmware keeps working.'
          : 'A unique ID is generated. Copy it into the ESP32 firmware afterwards.'
      }
      formId={FORM_ID}
      mode={device ? 'edit' : 'create'}
      pending={create.isPending || update.isPending}
      onCreateAnother={() => {
        another.current = true;
        form.handleSubmit();
      }}
      onDelete={device ? () => deleteDevicesAndRefresh([device.id]) : undefined}
      deleteTitle={
        device ? `Delete ${device.name}? Its plant and readings are deleted too.` : undefined
      }
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
          {device && (
            <Field>
              <FieldLabel htmlFor='device-id'>ID</FieldLabel>
              <Input id='device-id' value={device.id} disabled readOnly />
            </Field>
          )}
          <form.AppField
            name='name'
            children={(field) => <field.TextField label='Name' required placeholder='Greenhouse' />}
          />
        </FieldGroup>
      </form>
    </FormSheet>
  );
}

export function DeviceFormSheetTrigger() {
  const canWrite = useCan()('devices:write');
  const [open, setOpen] = useState(false);
  if (!canWrite) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Icons.add className='mr-2 h-4 w-4' /> New device identifier
      </Button>
      <DeviceFormSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
