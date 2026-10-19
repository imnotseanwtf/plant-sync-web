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
import { WiringDesigner } from '@/features/plants/components/wiring-editor';
import { useAppForm } from '@/lib/form';
import { defaultDesign, designErrors, type WiringDesign } from '@/lib/wiring/design';
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
  const initialDesign = device?.wiring ?? defaultDesign();
  const [design, setDesign] = useState<WiringDesign>(initialDesign);

  const form = useAppForm({
    defaultValues: initial,
    validators: { onSubmit: deviceSchema },
    onSubmit: async ({ value }) => {
      const wiringErrors = designErrors(design);
      if (wiringErrors.length > 0) {
        toast.error(wiringErrors[0]);
        return;
      }
      const values = { ...value, wiring: design };
      try {
        if (device) {
          await update.mutateAsync({ id: device.id, values });
          toast.success('Saved');
          onOpenChange(false);
        } else {
          await create.mutateAsync(values);
          toast.success('Created');
          if (another.current) {
            form.reset(initial);
            setDesign(defaultDesign());
          } else onOpenChange(false);
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  });

  // Start from the current record every time the panel opens.
  useEffect(() => {
    if (open) {
      form.reset(initial);
      setDesign(initialDesign);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, device?.name, device?.wiring]);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={device ? 'Edit Device Identifier' : 'New Device Identifier'}
      description={
        device
          ? 'Renaming keeps the ID, so the firmware keeps working.'
          : 'A unique ID is generated. Copy it into the ESP32 firmware afterwards. Design the board and sensors below.'
      }
      formId={FORM_ID}
      mode={device ? 'edit' : 'create'}
      fullscreen
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
          <div className='space-y-3 pt-2'>
            <div>
              <p className='text-sm font-medium'>Wiring</p>
              <p className='text-muted-foreground text-xs'>
                Choose the board and the parts wired to it, then assign each part's pins. The
                diagram and the sensor health checks on the plant page follow this design.
              </p>
            </div>
            <WiringDesigner design={design} onChange={setDesign} />
          </div>
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
