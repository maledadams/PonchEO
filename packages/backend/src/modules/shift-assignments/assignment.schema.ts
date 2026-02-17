import { z } from 'zod';

export const createAssignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftTemplateId: z.number().int().positive(),
  date: z.string().date('Must be YYYY-MM-DD format'),
});

export const bulkAssignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  shiftTemplateId: z.number().int().positive(),
  startDate: z.string().date('Must be YYYY-MM-DD format'),
  endDate: z.string().date('Must be YYYY-MM-DD format'),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day of week required'), // 0=Sunday, 1=Monday, ...6=Saturday
});

export const updateAssignmentSchema = z
  .object({
    shiftTemplateId: z.number().int().positive().optional(),
    date: z.string().date('Must be YYYY-MM-DD format').optional(),
  })
  .refine((value) => value.shiftTemplateId !== undefined || value.date !== undefined, {
    message: 'At least one field is required',
  });

export const assignmentQuerySchema = z.object({
  employeeId: z.coerce.number().int().positive().optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type BulkAssignmentInput = z.infer<typeof bulkAssignmentSchema>;
