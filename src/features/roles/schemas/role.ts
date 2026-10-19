import * as z from 'zod';
import { PERMISSIONS } from '@/lib/auth/rbac';

export const roleSchema = z.object({
  name: z.string().trim().min(1, 'The name field is required.').max(255),
  description: z.string().trim().max(500),
  permissions: z.array(z.enum(PERMISSIONS))
});

export type RoleFormValues = z.infer<typeof roleSchema>;
