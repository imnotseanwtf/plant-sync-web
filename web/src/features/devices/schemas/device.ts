import * as z from 'zod';

export const deviceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255)
});

export type DeviceFormValues = z.infer<typeof deviceSchema>;
