'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/components/auth/current-user-provider';
import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { FormFooter } from '@/components/resource/form-footer';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const LIST = '/dashboard/device-identifiers';

/** Create (no `device`) or edit a device identifier, with its board and sensor wiring, on one page. */
export function DeviceForm({ device }: { device?: Device }) {
  const router = useRouter();
  const canEdit = useCan()(device ? 'edit:devices' : 'create:devices');
  const another = useRef(false);
  const create = useMutation(createDeviceMutation);
  const update = useMutation(updateDeviceMutation);
  const initial = { name: device?.name ?? '' };
  const [design, setDesign] = useState<WiringDesign>(device?.wiring ?? defaultDesign());

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
          router.push(LIST);
        } else {
          await create.mutateAsync(values);
          toast.success('Created');
          if (another.current) {
            form.reset(initial);
            setDesign(defaultDesign());
          } else router.push(LIST);
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
      <fieldset disabled={!canEdit} className='contents'>
        <Card>
          <CardHeader>
            <CardTitle>Device identifier</CardTitle>
            <CardDescription>
              {device
                ? 'Renaming keeps the ID, so the firmware keeps working.'
                : 'A unique ID is generated. Copy it into the ESP32 firmware afterwards.'}
            </CardDescription>
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
                children={(field) => (
                  <field.TextField label='Name' required placeholder='Greenhouse' />
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wiring</CardTitle>
            <CardDescription>
              Choose the board and the parts wired to it, then assign each part&rsquo;s pins. The
              diagram and the sensor health checks on the plant page follow this design.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WiringDesigner design={design} onChange={setDesign} />
          </CardContent>
        </Card>
      </fieldset>

      {canEdit ? (
        <FormFooter
          mode={device ? 'edit' : 'create'}
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

export function DeviceDeleteButton({ device }: { device: Device }) {
  if (!useCan()('delete:devices')) return null;
  return (
    <DeleteRecordButton
      title={`Delete ${device.name}? Its plant and readings are deleted too.`}
      onDelete={() => deleteDevicesAndRefresh([device.id])}
      redirectTo={LIST}
    />
  );
}
