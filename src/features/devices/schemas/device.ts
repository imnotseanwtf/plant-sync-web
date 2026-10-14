import * as z from 'zod';

export const deviceSchema = z.object({
  name: z.string().trim().min(1, 'The name field is required.').max(255)
});

export type DeviceFormValues = z.infer<typeof deviceSchema>;
