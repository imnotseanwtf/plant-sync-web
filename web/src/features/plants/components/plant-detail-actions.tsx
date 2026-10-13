'use client';

import { useState } from 'react';
import { DeleteRecordButton } from '@/components/resource/delete-record-button';
import { Button } from '@/components/ui/button';
import { deletePlantsAndRefresh } from '../api/mutations';
import type { Plant } from '../api/types';
import { PlantFormSheet } from './plant-form-sheet';

/** Header actions on the plant page: edit in a side panel, or delete. */
export function PlantDetailActions({ plant }: { plant: Plant }) {
  const [open, setOpen] = useState(false);
  return (
    <div className='flex items-center gap-2'>
      <Button variant='outline' onClick={() => setOpen(true)}>
        Edit
      </Button>
      <DeleteRecordButton
        title={`Delete ${plant.name}?`}
        onDelete={() => deletePlantsAndRefresh([plant.id])}
        redirectTo='/dashboard/plants'
      />
      <PlantFormSheet plant={plant} open={open} onOpenChange={setOpen} />
    </div>
  );
}
