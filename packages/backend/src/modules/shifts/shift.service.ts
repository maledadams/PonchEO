import prisma from '../../config/database';
import { Errors } from '../../shared/errors/AppError';
import { CreateShiftInput, UpdateShiftInput } from './shift.schema';

export async function findAll(includeInactive = false) {
  return prisma.shiftTemplate.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function findById(id: number) {
  const shift = await prisma.shiftTemplate.findUnique({ where: { id } });
  if (!shift) throw Errors.notFound('ShiftTemplate', id);
  return shift;
}

export async function create(input: CreateShiftInput) {
  return prisma.shiftTemplate.create({ data: input });
}

export async function update(id: number, input: UpdateShiftInput) {
  await findById(id);
  return prisma.shiftTemplate.update({ where: { id }, data: input });
}

export async function softDelete(id: number) {
  await findById(id);
  return prisma.shiftTemplate.update({
    where: { id },
    data: { isActive: false },
  });
}
