import { z } from 'zod';

export const generatePayrollSchema = z.object({
  periodStart: z.string().date('Must be YYYY-MM-DD format'),
  periodEnd: z.string().date('Must be YYYY-MM-DD format'),
  periodType: z.enum(['WEEKLY', 'BIWEEKLY']),
  employeeIds: z.array(z.number().int().positive()).optional(), // If omitted, all active employees
});

export const payrollQuerySchema = z.object({
  periodStart: z.string().date().optional(),
  periodEnd: z.string().date().optional(),
  status: z.enum(['DRAFT', 'FINALIZED']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;
