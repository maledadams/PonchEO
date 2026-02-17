import { z } from 'zod';

export const punchQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'AUTO_CLOSED', 'CORRECTED']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export type PunchQuery = z.infer<typeof punchQuerySchema>;
