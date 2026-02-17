import prisma from '../../config/database';
import { Errors } from '../../shared/errors/AppError';
import { CreateDepartmentInput } from './department.schema';

export async function findAll() {
  return prisma.department.findMany({ orderBy: { name: 'asc' } });
}

export async function findById(id: number) {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw Errors.notFound('Department', id);
  return department;
}

export async function create(input: CreateDepartmentInput) {
  return prisma.department.create({ data: input });
}

export async function update(id: number, input: CreateDepartmentInput) {
  await findById(id);
  return prisma.department.update({ where: { id }, data: input });
}

export async function remove(id: number) {
  await findById(id);
  return prisma.department.delete({ where: { id } });
}
