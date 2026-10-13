import { mutationOptions } from '@tanstack/react-query';
import { unwrap } from '@/lib/action-result';
import { getQueryClient } from '@/lib/query-client';
import { plantKeys } from '@/features/plants/api/queries';
import { createDevice, deleteDevice, updateDevice } from './service';
import { deviceKeys } from './queries';
import type { DeviceMutationPayload } from './types';

// Invalidation lives in mutationFn (not onSuccess) because components spread these options and
// pass their own onSuccess, which would otherwise replace it.
const invalidate = () => {
  const client = getQueryClient();
  return Promise.all([
    client.invalidateQueries({ queryKey: deviceKeys.all }),
    // Renaming or deleting a device changes plant rows too.
    client.invalidateQueries({ queryKey: plantKeys.all })
  ]);
};

export const createDeviceMutation = mutationOptions({
  mutationFn: async (data: DeviceMutationPayload) => {
    const result = unwrap(await createDevice(data));
    await invalidate();
    return result;
  }
});

export const updateDeviceMutation = mutationOptions({
  mutationFn: async ({ id, values }: { id: string; values: DeviceMutationPayload }) => {
    const result = unwrap(await updateDevice(id, values));
    await invalidate();
    return result;
  }
});

export const deleteDeviceMutation = mutationOptions({
  mutationFn: async (id: string) => {
    const result = unwrap(await deleteDevice(id));
    await invalidate();
    return result;
  }
});
