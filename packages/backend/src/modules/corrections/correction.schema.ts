import { z } from 'zod';

export const createCorrectionSchema = z.object({
  punchId: z.number().int().positive(),
  correctedClockIn: z.string().datetime(),
  correctedClockOut: z.string().datetime().optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const reviewCorrectionSchema = z.object({
  comments: z.string().optional(),
});

export const correctionQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;
export type ReviewCorrectionInput = z.infer<typeof reviewCorrectionSchema>;
