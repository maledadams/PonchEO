import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { Errors } from '../../shared/errors/AppError';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employee.schema';

const SALT_ROUNDS = 10;

// Exclude password hash from responses
const employeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  departmentId: true,
  hireDate: true,
  hourlyRate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
};

export async function findAll(includeInactive = false) {
  return prisma.employee.findMany({
    where: includeInactive ? {} : { isActive: true },
    select: employeeSelect,
    orderBy: { lastName: 'asc' },
  });
}

export async function findById(id: number) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: employeeSelect,
  });
  if (!employee) throw Errors.notFound('Employee', id);
  return employee;
}

export async function create(input: CreateEmployeeInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  return prisma.employee.create({
    data: {
      employeeCode: input.employeeCode,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
      role: input.role,
      departmentId: input.departmentId,
      hireDate: new Date(input.hireDate),
      hourlyRate: input.hourlyRate,
    },
    select: employeeSelect,
  });
}

export async function update(id: number, input: UpdateEmployeeInput) {
  await findById(id); // Throws if not found

  return prisma.employee.update({
    where: { id },
    data: input,
    select: employeeSelect,
  });
}

export async function softDelete(id: number) {
  await findById(id);
  return prisma.employee.update({
    where: { id },
    data: { isActive: false },
    select: employeeSelect,
  });
}
