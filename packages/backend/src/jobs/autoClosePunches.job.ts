import cron from 'node-cron';
import prisma from '../config/database';
import { env } from '../config/env';
import { calculateWorkedMinutes, calculateShiftEndDateTime } from '../shared/utils/time.utils';
import { recalculateDailyTimesheet } from '../modules/punches/punch.service';

/**
 * Auto-close orphan punches that have been open for too long.
 * Runs as a cron job (default: 2:00 AM daily).
 *
 * Logic:
 * - Find all OPEN punches older than threshold (default 14 hours)
 * - For each: set clockOut to the shift's scheduled end time (not current time)
 * - Mark as AUTO_CLOSED with isAutoCompleted = true
 * - Recalculate the DailyTimesheet for that date
 */
async function autoCloseOrphanPunches(): Promise<number> {
  const thresholdMs = env.AUTO_CLOSE_THRESHOLD_HOURS * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - thresholdMs);

  const orphanPunches = await prisma.punch.findMany({
    where: {
      status: 'OPEN',
      clockIn: { lt: cutoffTime },
    },
    include: {
      shiftAssignment: { include: { shiftTemplate: true } },
    },
  });

  let closedCount = 0;

  for (const punch of orphanPunches) {
    let assumedClockOut: Date;

    if (punch.shiftAssignment?.shiftTemplate) {
      const template = punch.shiftAssignment.shiftTemplate;
      assumedClockOut = calculateShiftEndDateTime(
        punch.shiftAssignment.date,
        template.startTime,
        template.endTime,
      );
    } else {
      // No shift assigned — assume 8 hours after clock-in
      assumedClockOut = new Date(punch.clockIn.getTime() + 8 * 60 * 60 * 1000);
    }

    const breakMinutes = punch.shiftAssignment?.shiftTemplate?.breakMinutes || 60;
    const workedMinutes = calculateWorkedMinutes(punch.clockIn, assumedClockOut, breakMinutes);

    await prisma.punch.update({
      where: { id: punch.id },
      data: {
        clockOut: assumedClockOut,
        status: 'AUTO_CLOSED',
        isAutoCompleted: true,
        workedMinutes,
        notes: 'Auto-closed by system. Employee did not clock out.',
      },
    });

    // Recalculate timesheet
    if (punch.shiftAssignment) {
      await recalculateDailyTimesheet(punch.employeeId, punch.shiftAssignment.date);
    }

    closedCount++;
  }

  return closedCount;
}

export async function runAutoCloseJobOnce(): Promise<number> {
  return autoCloseOrphanPunches();
}

export function startAutoCloseJob() {
  cron.schedule(env.AUTO_CLOSE_CRON, async () => {
    try {
      const count = await autoCloseOrphanPunches();
      if (count > 0) {
        console.log(`[AutoClose] Closed ${count} orphan punch(es)`);
      }
    } catch (err) {
      console.error('[AutoClose] Job failed:', err);
    }
  });

  console.log(`[AutoClose] Scheduled: ${env.AUTO_CLOSE_CRON}`);
}
