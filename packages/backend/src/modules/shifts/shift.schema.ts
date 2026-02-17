import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createShiftSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().regex(timeRegex, 'Must be HH:mm format (e.g., "08:00")'),
  endTime: z.string().regex(timeRegex, 'Must be HH:mm format (e.g., "16:00")'),
  shiftType: z.enum(['DIURNA', 'NOCTURNA', 'MIXTA']),
  breakMinutes: z.number().int().min(0).default(60),
  gracePeriodMinutes: z.number().int().min(0).default(10),
});

export const updateShiftSchema = createShiftSchema.partial();

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
