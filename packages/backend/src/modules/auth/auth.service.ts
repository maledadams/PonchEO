import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { Errors } from '../../shared/errors/AppError';
import { LoginInput } from './auth.schema';

export async function login(input: LoginInput) {
  const employee = await prisma.employee.findUnique({
    where: { email: input.email },
    include: { department: true },
  });

  if (!employee || !employee.isActive) {
    throw Errors.unauthorized('Invalid email or password');
  }

  const isValid = await bcrypt.compare(input.password, employee.passwordHash);
  if (!isValid) {
    throw Errors.unauthorized('Invalid email or password');
  }

  const token = jwt.sign(
    { id: employee.id, role: employee.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

  return {
    token,
    user: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role,
      department: employee.department?.name || null,
    },
  };
}

export async function getMe(userId: number) {
  const employee = await prisma.employee.findUnique({
    where: { id: userId },
    include: { department: true },
  });

  if (!employee) {
    throw Errors.notFound('Employee', userId);
  }

  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: employee.role,
    department: employee.department?.name || null,
  };
}
