import prisma from '../../config/database';
import { Errors } from '../../shared/errors/AppError';
import { CreateAssignmentInput, BulkAssignmentInput } from './assignment.schema';

const includeRelations = {
  employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  shiftTemplate: { select: { id: true, name: true, startTime: true, endTime: true, shiftType: true } },
};

export async function findAll(filters: {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
}) {
  return prisma.shiftAssignment.findMany({
    where: {
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.startDate &&
        filters.endDate && {
          date: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate),
          },
        }),
    },
    include: includeRelations,
    orderBy: { date: 'asc' },
  });
}

export async function findById(id: number) {
  const assignment = await prisma.shiftAssignment.findUnique({
    where: { id },
    include: includeRelations,
  });
  if (!assignment) throw Errors.notFound('ShiftAssignment', id);
  return assignment;
}

export async function create(input: CreateAssignmentInput) {
  return prisma.shiftAssignment.create({
    data: {
      employeeId: input.employeeId,
      shiftTemplateId: input.shiftTemplateId,
      date: new Date(input.date),
    },
    include: includeRelations,
  });
}

export async function bulkCreate(input: BulkAssignmentInput) {
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const assignments: { employeeId: number; shiftTemplateId: number; date: Date }[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    if (input.daysOfWeek.includes(current.getUTCDay())) {
      assignments.push({
        employeeId: input.employeeId,
        shiftTemplateId: input.shiftTemplateId,
        date: new Date(current),
      });
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Use skipDuplicates to avoid errors when assignments already exist
  const result = await prisma.shiftAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  return { created: result.count, total: assignments.length };
}

export async function update(id: number, input: Partial<CreateAssignmentInput>) {
  await findById(id);
  return prisma.shiftAssignment.update({
    where: { id },
    data: {
      ...(input.shiftTemplateId && { shiftTemplateId: input.shiftTemplateId }),
      ...(input.date && { date: new Date(input.date) }),
    },
    include: includeRelations,
  });
}

export async function remove(id: number) {
  await findById(id);
  return prisma.shiftAssignment.delete({ where: { id } });
}
