import prisma from '../../config/database';
import { AppError, Errors } from '../../shared/errors/AppError';
import {
  calculateWorkedMinutes,
  calculateTardiness,
  calculateNightMinutes,
} from '../../shared/utils/time.utils';
import { PunchQuery } from './punch.schema';

type RequestUser = { id: number; role: 'EMPLOYEE' | 'SUPERVISOR' };

const includeRelations = {
  employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  shiftAssignment: {
    include: {
      shiftTemplate: true,
    },
  },
};

export async function findAll(filters: PunchQuery, requester: RequestUser) {
  const effectiveEmployeeId =
    requester.role === 'SUPERVISOR' ? filters.employeeId : requester.id;

  return prisma.punch.findMany({
    where: {
      ...(effectiveEmployeeId && { employeeId: effectiveEmployeeId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.startDate &&
        filters.endDate && {
          clockIn: {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate + 'T23:59:59.999Z'),
          },
        }),
    },
    include: includeRelations,
    orderBy: { clockIn: 'desc' },
  });
}

export async function findById(id: number, requester: RequestUser) {
  const punch = await prisma.punch.findUnique({
    where: { id },
    include: includeRelations,
  });
  if (!punch) throw Errors.notFound('Punch', id);
  if (requester.role !== 'SUPERVISOR' && punch.employeeId !== requester.id) {
    throw Errors.forbidden('You can only access your own punches');
  }
  return punch;
}

export async function findOpenPunches() {
  return prisma.punch.findMany({
    where: { status: 'OPEN' },
    include: includeRelations,
    orderBy: { clockIn: 'asc' },
  });
}

export async function clockIn(employeeId: number) {
  // Check for existing open punch
  const openPunch = await prisma.punch.findFirst({
    where: { employeeId, status: 'OPEN' },
  });

  if (openPunch) {
    throw new AppError(409, 'PUNCH_ALREADY_OPEN', 'You have an open punch. Clock out first or request a correction.', {
      openPunchId: openPunch.id,
      clockIn: openPunch.clockIn,
    });
  }

  // Get today's shift assignment
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const shiftAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      date: today,
    },
    include: { shiftTemplate: true },
  });

  if (!shiftAssignment) {
    throw new AppError(400, 'NO_SHIFT_ASSIGNED', 'No shift assigned for today. Contact your supervisor.');
  }

  // Calculate tardiness
  const now = new Date();
  const tardinessMinutes = calculateTardiness(
    now,
    shiftAssignment.shiftTemplate.startTime,
    shiftAssignment.date,
    shiftAssignment.shiftTemplate.gracePeriodMinutes,
  );

  return prisma.punch.create({
    data: {
      employeeId,
      shiftAssignmentId: shiftAssignment.id,
      clockIn: now,
      tardinessMinutes,
      status: 'OPEN',
    },
    include: includeRelations,
  });
}

export async function clockOut(employeeId: number) {
  const openPunch = await prisma.punch.findFirst({
    where: { employeeId, status: 'OPEN' },
    include: {
      shiftAssignment: { include: { shiftTemplate: true } },
    },
  });

  if (!openPunch) {
    throw new AppError(404, 'PUNCH_NOT_FOUND', 'No open punch found. Clock in first.');
  }

  const now = new Date();
  const breakMinutes = openPunch.shiftAssignment?.shiftTemplate?.breakMinutes || 60;
  const workedMinutes = calculateWorkedMinutes(openPunch.clockIn, now, breakMinutes);

  const updatedPunch = await prisma.punch.update({
    where: { id: openPunch.id },
    data: {
      clockOut: now,
      workedMinutes,
      status: 'CLOSED',
    },
    include: includeRelations,
  });

  // Recalculate daily timesheet
  await recalculateDailyTimesheet(employeeId, openPunch.shiftAssignment!.date);

  return updatedPunch;
}

/**
 * Recalculates the DailyTimesheet for a given employee and date.
 * Called after clock-out, correction approval, or auto-close.
 */
export async function recalculateDailyTimesheet(employeeId: number, date: Date) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  // Get all closed punches for this employee on this date
  const punches = await prisma.punch.findMany({
    where: {
      employeeId,
      shiftAssignment: { date: dayStart },
      status: { in: ['CLOSED', 'AUTO_CLOSED', 'CORRECTED'] },
    },
  });

  let totalWorkedMinutes = 0;
  let nightMinutes = 0;
  let tardinessMinutes = 0;

  for (const punch of punches) {
    totalWorkedMinutes += punch.workedMinutes || 0;
    tardinessMinutes += punch.tardinessMinutes || 0;

    if (punch.clockIn && punch.clockOut) {
      nightMinutes += calculateNightMinutes(punch.clockIn, punch.clockOut);
    }
  }

  // Check if this date is a holiday
  const holiday = await prisma.holiday.findUnique({ where: { date: dayStart } });
  const isRestDay = dayStart.getUTCDay() === 0; // Sunday

  await prisma.dailyTimesheet.upsert({
    where: { employeeId_date: { employeeId, date: dayStart } },
    create: {
      employeeId,
      date: dayStart,
      totalWorkedMinutes,
      regularMinutes: totalWorkedMinutes,
      nightMinutes,
      tardinessMinutes,
      isHoliday: !!holiday,
      isRestDay,
      status: 'DRAFT',
    },
    update: {
      totalWorkedMinutes,
      regularMinutes: totalWorkedMinutes,
      nightMinutes,
      tardinessMinutes,
      isHoliday: !!holiday,
      isRestDay,
    },
  });
}
