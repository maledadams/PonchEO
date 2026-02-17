import { z } from 'zod';

export const createHolidaySchema = z.object({
  date: z.string().date('Must be YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required'),
  isRecurring: z.boolean().default(false),
  year: z.number().int().positive().optional(),
});

export const updateHolidaySchema = createHolidaySchema.partial().refine(
  (value) =>
    value.date !== undefined ||
    value.name !== undefined ||
    value.isRecurring !== undefined ||
    value.year !== undefined,
  { message: 'At least one field is required' },
);

export const holidayQuerySchema = z.object({
  year: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export const yearParamSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'year must be YYYY format'),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
