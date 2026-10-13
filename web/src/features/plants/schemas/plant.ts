import * as z from 'zod';

const required = (label: string) => ({ error: `The ${label} field is required.` });

export const plantSchema = z
  .object({
    name: z.string().trim().min(1, 'The name field is required.').max(255),
    deviceIdentifierId: z.uuid('The device identifier field is required.'),
    moistureLevelMin: z.number(required('moisture level min')),
    moistureLevelMax: z.number(required('moisture level max')),
    humidity: z.number(required('humidity')),
    temperature: z.number(required('temperature')),
    lightIntensity: z.number(required('light intensity'))
  })
  .refine((v) => v.moistureLevelMin <= v.moistureLevelMax, {
    path: ['moistureLevelMax'],
    message: 'Moisture level max must be at least the minimum.'
  });

export type PlantFormValues = z.infer<typeof plantSchema>;
