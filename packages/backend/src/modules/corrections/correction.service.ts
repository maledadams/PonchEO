import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError, Errors } from '../../shared/errors/AppError';
import { CreateCorrectionInput, ReviewCorrectionInput } from './correction.schema';
import { recalculateDailyTimesheet } from '../punches/punch.service';
import { calculateWorkedMinutes } from '../../shared/utils/time.utils';

const includeRelations = {
  punch: {
    include: {
      employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      shiftAssignment: { include: { shiftTemplate: true } },
    },
  },
  requestedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  approval: {
    include: {
      supervisor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
};

type RequestUser = { id: number; role: 'EMPLOYEE' | 'SUPERVISOR' };

export async function findAll(
  filters: { status?: string; employeeId?: number },
  requester: RequestUser,
) {
  const effectiveEmployeeId =
    requester.role === 'SUPERVISOR'
      ? filters.employeeId
      : requester.id;

  return prisma.correction.findMany({
    where: {
      ...(filters.status && { status: filters.status as any }),
      ...(effectiveEmployeeId && { requestedById: effectiveEmployeeId }),
    },
    include: includeRelations,
    orderBy: { createdAt: 'desc' },
  });
}

export async function findById(id: number, requester: RequestUser) {
  const correction = await prisma.correction.findUnique({
    where: { id },
    include: includeRelations,
  });
  if (!correction) throw Errors.notFound('Correction', id);

  if (requester.role !== 'SUPERVISOR' && correction.requestedById !== requester.id) {
    throw Errors.forbidden('You can only access your own correction requests');
  }

  return correction;
}

export async function create(input: CreateCorrectionInput, requestedById: number) {
  // Get the punch
  const punch = await prisma.punch.findUnique({ where: { id: input.punchId } });
  if (!punch) throw Errors.notFound('Punch', input.punchId);
  if (punch.employeeId !== requestedById) {
    throw Errors.forbidden('You can only request corrections for your own punches');
  }

  // Check if correction already exists for this punch
  const existing = await prisma.correction.findUnique({ where: { punchId: input.punchId } });
  if (existing) {
    throw new AppError(409, 'CORRECTION_EXISTS', 'A correction already exists for this punch', {
      correctionId: existing.id,
      status: existing.status,
    });
  }

  return prisma.correction.create({
    data: {
      punchId: input.punchId,
      requestedById,
      reason: input.reason,
      originalClockIn: punch.clockIn,
      originalClockOut: punch.clockOut,
      correctedClockIn: new Date(input.correctedClockIn),
      correctedClockOut: input.correctedClockOut ? new Date(input.correctedClockOut) : null,
      status: 'PENDING',
    },
    include: includeRelations,
  });
}

export async function approve(correctionId: number, supervisorId: number, input: ReviewCorrectionInput) {
  const correction = await prisma.correction.findUnique({
    where: { id: correctionId },
    include: {
      punch: { include: { shiftAssignment: { include: { shiftTemplate: true } } } },
    },
  });

  if (!correction) throw Errors.notFound('Correction', correctionId);
  if (correction.status !== 'PENDING') {
    throw new AppError(409, 'CORRECTION_ALREADY_REVIEWED', 'This correction has already been reviewed');
  }

  const breakMinutes = correction.punch.shiftAssignment?.shiftTemplate?.breakMinutes || 60;
  const workedMinutes = correction.correctedClockOut
    ? calculateWorkedMinutes(correction.correctedClockIn, correction.correctedClockOut, breakMinutes)
    : null;

  // Transaction: update correction, create approval, update punch, recalc timesheet
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update correction status
    const updatedCorrection = await tx.correction.update({
      where: { id: correctionId },
      data: { status: 'APPROVED' },
    });

    // Create approval record
    await tx.approval.create({
      data: {
        correctionId,
        supervisorId,
        decision: 'APPROVED',
        comments: input.comments,
      },
    });

    // Update the punch
    await tx.punch.update({
      where: { id: correction.punchId },
      data: {
        clockIn: correction.correctedClockIn,
        clockOut: correction.correctedClockOut,
        workedMinutes,
        status: 'CORRECTED',
      },
    });

    return updatedCorrection;
  });

  // Recalculate timesheet (outside transaction for simplicity)
  if (correction.punch.shiftAssignment) {
    await recalculateDailyTimesheet(
      correction.punch.employeeId,
      correction.punch.shiftAssignment.date,
    );
  }

  return findById(correctionId, { id: supervisorId, role: 'SUPERVISOR' });
}

export async function reject(correctionId: number, supervisorId: number, input: ReviewCorrectionInput) {
  const correction = await prisma.correction.findUnique({ where: { id: correctionId } });

  if (!correction) throw Errors.notFound('Correction', correctionId);
  if (correction.status !== 'PENDING') {
    throw new AppError(409, 'CORRECTION_ALREADY_REVIEWED', 'This correction has already been reviewed');
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.correction.update({
      where: { id: correctionId },
      data: { status: 'REJECTED' },
    });

    await tx.approval.create({
      data: {
        correctionId,
        supervisorId,
        decision: 'REJECTED',
        comments: input.comments,
      },
    });
  });

  return findById(correctionId, { id: supervisorId, role: 'SUPERVISOR' });
}
