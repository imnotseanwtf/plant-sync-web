import { mutationOptions } from '@tanstack/react-query';
import { unwrap } from '@/lib/action-result';
import { getQueryClient } from '@/lib/query-client';
import { userKeys } from '@/features/users/api/queries';
import { createRole, deleteRoles, updateRole } from './service';
import { roleKeys } from './queries';
import type { RoleMutationPayload } from './types';

// Invalidation lives in mutationFn (not onSuccess) because components spread these options and
// pass their own onSuccess, which would otherwise replace it.
const invalidate = () => {
  const client = getQueryClient();
  return Promise.all([
    client.invalidateQueries({ queryKey: roleKeys.all }),
    // Users show their roles, and role changes can change who has what.
    client.invalidateQueries({ queryKey: userKeys.all })
  ]);
};

export const createRoleMutation = mutationOptions({
  mutationFn: async (data: RoleMutationPayload) => {
    const result = unwrap(await createRole(data));
    await invalidate();
    return result;
  }
});

export const updateRoleMutation = mutationOptions({
  mutationFn: async ({ id, values }: { id: number; values: RoleMutationPayload }) => {
    const result = unwrap(await updateRole(id, values));
    await invalidate();
    return result;
  }
});

export async function deleteRolesAndRefresh(ids: (string | number)[]) {
  const result = unwrap(await deleteRoles(ids.map(Number)));
  await invalidate();
  return result;
}
