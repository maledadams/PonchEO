import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

export const updateDepartmentSchema = createDepartmentSchema;

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
