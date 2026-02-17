import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export const updateOvertimeRuleSchema = z
  .object({
    description: z.string().min(1).optional(),
    thresholdMinutes: z.number().int().min(0).nullable().optional(),
    maxMinutes: z.number().int().min(0).nullable().optional(),
    multiplier: z.number().positive().optional(),
    isActive: z.boolean().optional(),
    priority: z.number().int().optional(),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.thresholdMinutes !== undefined ||
      value.maxMinutes !== undefined ||
      value.multiplier !== undefined ||
      value.isActive !== undefined ||
      value.priority !== undefined,
    { message: 'At least one field is required' },
  );
