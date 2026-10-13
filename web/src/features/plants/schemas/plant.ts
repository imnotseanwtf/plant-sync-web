import * as z from 'zod';

const percent = (label: string) =>
  z
    .number({ error: `${label} is required` })
    .min(0, 'Min 0')
    .max(100, 'Max 100');

export const plantSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
    deviceIdentifierId: z.uuid('Select a device'),
    moistureLevelMin: percent('Minimum moisture'),
    moistureLevelMax: percent('Maximum moisture'),
    humidity: percent('Target humidity'),
    temperature: z.number({ error: 'Target temperature is required' }).min(-50).max(100),
    lightIntensity: z.number({ error: 'Target light is required' }).min(0, 'Min 0')
  })
  .refine((v) => v.moistureLevelMin <= v.moistureLevelMax, {
    path: ['moistureLevelMax'],
    message: 'Must be at least the minimum'
  });

export type PlantFormValues = z.infer<typeof plantSchema>;
