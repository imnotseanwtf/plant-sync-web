'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { saveWiringMutation } from '@/features/devices/api/mutations';
import type { DeviceHealth } from '@/lib/sensor-health';
import { boardById, boardPins, BOARDS } from '@/lib/wiring/boards';
import {
  addSensor,
  defaultDesign,
  designErrors,
  retargetBoard,
  type WiringDesign
} from '@/lib/wiring/design';
import { isShareable, pinFits, SENSOR_TYPES, SENSORS, type SensorType } from '@/lib/wiring/sensors';
import { WiringDiagram } from './wiring-diagram';

const SAMPLE_VALUES: Partial<Record<SensorType, string>> = {
  soil: '52.3%',
  bh1750: '612 lux',
  dht22: '24.1°C · 55%'
};

/** The preview shows every part as working so the wiring is easy to read. */
function previewHealth(design: WiringDesign): DeviceHealth {
  return {
    board: 'online',
    parts: Object.fromEntries(design.sensors.map((s) => [s.type, 'ok'])),
    irrigating: false,
    faults: []
  };
}

function PinSelect({
  value,
  options,
  onChange,
  label
}: {
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger aria-label={label} className='w-full'>
        <SelectValue placeholder='Pick a pin' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function WiringEditorForm({
  deviceId,
  initial,
  onClose
}: {
  deviceId: string;
  initial: WiringDesign;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const save = useMutation(saveWiringMutation);
  const board = boardById(draft.board);
  const errors = designErrors(draft);
  const missing = SENSOR_TYPES.filter((t) => !draft.sensors.some((s) => s.type === t));

  // Pins other parts already use: plain pins block everything, I²C pins only block plain use.
  const taken = (except: SensorType) => {
    const plain = new Map<string, string>();
    const bus = new Map<string, string>();
    for (const s of draft.sensors) {
      if (s.type === except) continue;
      for (const p of SENSORS[s.type].pins) {
        if (p.kind === 'i2c') bus.set(s.pins[p.name], SENSORS[s.type].title);
        else if (!isShareable(p.kind)) plain.set(s.pins[p.name], SENSORS[s.type].title);
      }
    }
    return { plain, bus };
  };

  const setPin = (type: SensorType, pin: string, id: string) =>
    setDraft((d) => ({
      ...d,
      sensors: d.sensors.map((s) =>
        s.type === type ? { ...s, pins: { ...s.pins, [pin]: id } } : s
      )
    }));

  const options = (type: SensorType, kind: Parameters<typeof pinFits>[0]) => {
    if (!board) return [];
    const used = taken(type);
    return boardPins(board)
      .filter(({ pin }) => pinFits(kind, pin))
      .map(({ pin, side }) => {
        const owner =
          kind === 'i2c'
            ? used.plain.get(pin.id)
            : isShareable(kind)
              ? undefined
              : (used.plain.get(pin.id) ?? used.bus.get(pin.id));
        const gpio = pin.gpio !== undefined && pin.kind === 'gpio' ? ` · GPIO${pin.gpio}` : '';
        return {
          value: pin.id,
          label: `${pin.label}${gpio} (${side})${pin.warn ? ' ⚠' : ''}${owner ? ` — used by ${owner}` : ''}`,
          disabled: !!owner
        };
      });
  };

  const warnings = draft.sensors.flatMap((s) =>
    SENSORS[s.type].pins.flatMap((p) => {
      const pin = board && boardPins(board).find((b) => b.pin.id === s.pins[p.name])?.pin;
      return pin?.warn ? [`${SENSORS[s.type].title} ${p.name} on ${pin.label}: ${pin.warn}`] : [];
    })
  );

  return (
    <>
      <div className='flex-1 space-y-6 overflow-auto p-4'>
        <div className='bg-card overflow-x-auto rounded-xl border p-3'>
          <WiringDiagram
            design={draft}
            health={previewHealth(draft)}
            values={SAMPLE_VALUES}
            summary='Preview of the wiring being edited.'
          />
        </div>

        <Field>
          <FieldLabel htmlFor='wiring-board'>Board</FieldLabel>
          <Select
            items={BOARDS.map((b) => ({ value: b.id, label: b.name }))}
            value={draft.board}
            onValueChange={(id) => id && setDraft((d) => retargetBoard(d, id))}
          >
            <SelectTrigger id='wiring-board' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {BOARDS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            Changing the board re-picks every sensor's pins for the new board.
          </FieldDescription>
        </Field>

        <div className='grid gap-4 md:grid-cols-2'>
          {draft.sensors.map((s) => {
            const def = SENSORS[s.type];
            return (
              <div key={s.type} className='space-y-3 rounded-xl border p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-medium'>{def.name}</p>
                    <p className='text-muted-foreground text-xs'>{def.model}</p>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    aria-label={`Remove ${def.name}`}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        sensors: d.sensors.filter((x) => x.type !== s.type)
                      }))
                    }
                  >
                    <Icons.trash className='size-4' />
                  </Button>
                </div>
                {def.pins.map((p) => (
                  <Field key={p.name}>
                    <FieldLabel>{p.name}</FieldLabel>
                    <PinSelect
                      label={`${def.title} ${p.name} pin`}
                      value={s.pins[p.name] ?? ''}
                      options={options(s.type, p.kind)}
                      onChange={(id) => setPin(s.type, p.name, id)}
                    />
                  </Field>
                ))}
              </div>
            );
          })}
        </div>

        {missing.length > 0 && (
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Add a part:</span>
            {missing.map((t) => (
              <Button
                key={t}
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setDraft((d) => addSensor(d, t))}
              >
                <Icons.add className='mr-1 size-4' />
                {SENSORS[t].title}
              </Button>
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant='destructive'>
            <Icons.warning />
            <AlertTitle>Fix these before saving</AlertTitle>
            <AlertDescription>
              <ul className='list-disc pl-4'>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {errors.length === 0 && warnings.length > 0 && (
          <Alert>
            <Icons.warning />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              <ul className='list-disc pl-4'>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <SheetFooter className='sm:flex-row sm:justify-between'>
        <Button type='button' variant='ghost' onClick={() => setDraft(defaultDesign(draft.board))}>
          Reset to default wiring
        </Button>
        <div className='flex gap-2'>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type='button'
            loading={save.isPending}
            disabled={errors.length > 0}
            onClick={() =>
              save.mutate(
                { id: deviceId, design: draft },
                {
                  onSuccess: () => {
                    toast.success('Wiring saved');
                    onClose();
                  },
                  onError: (e) => toast.error(e.message)
                }
              )
            }
          >
            Save wiring
          </LoadingButton>
        </div>
      </SheetFooter>
    </>
  );
}

/** "Edit wiring" button and the side panel where a device's board and sensors are designed. */
export function WiringEditorButton({
  deviceId,
  design
}: {
  deviceId: string;
  design: WiringDesign;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Icons.edit className='mr-1.5 size-4' />
        Edit wiring
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='flex w-full flex-col sm:max-w-4xl'>
          <SheetHeader>
            <SheetTitle>Design device wiring</SheetTitle>
            <SheetDescription>
              Choose the board and the parts wired to it, then assign each part's pins. The diagram
              and the sensor health checks follow this design.
            </SheetDescription>
          </SheetHeader>
          {/* Remounted on every open so the draft always starts from the saved design. */}
          {open && (
            <WiringEditorForm deviceId={deviceId} initial={design} onClose={() => setOpen(false)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
