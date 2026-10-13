import { mutationOptions } from '@tanstack/react-query';
import { unwrap } from '@/lib/action-result';
import { getQueryClient } from '@/lib/query-client';
import { deviceKeys } from '@/features/devices/api/queries';
import { createPlant, deletePlants, updatePlant } from './service';
import { plantKeys } from './queries';
import type { PlantMutationPayload } from './types';

// Invalidation lives in mutationFn (not onSuccess) because components spread these options and
// pass their own onSuccess, which would otherwise replace it.
const invalidate = () => {
  const client = getQueryClient();
  return Promise.all([
    client.invalidateQueries({ queryKey: plantKeys.all }),
    // The device picker only offers devices without a plant.
    client.invalidateQueries({ queryKey: deviceKeys.all })
  ]);
};

export const createPlantMutation = mutationOptions({
  mutationFn: async (data: PlantMutationPayload) => {
    const result = unwrap(await createPlant(data));
    await invalidate();
    return result;
  }
});

export const updatePlantMutation = mutationOptions({
  mutationFn: async ({ id, values }: { id: number; values: PlantMutationPayload }) => {
    const result = unwrap(await updatePlant(id, values));
    await invalidate();
    return result;
  }
});

export async function deletePlantsAndRefresh(ids: (string | number)[]) {
  const result = unwrap(await deletePlants(ids.map(Number)));
  await invalidate();
  return result;
}
