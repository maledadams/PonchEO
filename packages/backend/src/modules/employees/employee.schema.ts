import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['EMPLOYEE', 'SUPERVISOR']).default('EMPLOYEE'),
  departmentId: z.number().int().positive().optional(),
  hireDate: z.string().datetime().or(z.string().date()),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['EMPLOYEE', 'SUPERVISOR']).optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  hourlyRate: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const employeeQuerySchema = z.object({
  includeInactive: z
    .enum(['true', 'false'])
    .optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
