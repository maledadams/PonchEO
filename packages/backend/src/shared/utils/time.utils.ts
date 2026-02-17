/**
 * Time calculation utilities for PonchEO.
 * All times stored as UTC. Dominican Republic is UTC-4 (AST), no DST.
 */

const NIGHT_START_HOUR = 21; // 9:00 PM
const NIGHT_END_HOUR = 7;    // 7:00 AM

/**
 * Calculate the number of minutes worked between clock-in and clock-out,
 * minus break time.
 */
export function calculateWorkedMinutes(
  clockIn: Date,
  clockOut: Date,
  breakMinutes: number,
): number {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  return Math.max(totalMinutes - breakMinutes, 0);
}

/**
 * Calculate how many minutes of a shift fall within night hours (21:00 - 07:00).
 * Handles shifts that cross midnight.
 */
export function calculateNightMinutes(clockIn: Date, clockOut: Date): number {
  let nightMinutes = 0;
  const current = new Date(clockIn);

  // Iterate minute by minute would be too slow for long shifts.
  // Instead, we calculate overlaps with night windows.
  while (current < clockOut) {
    const dayStart = new Date(current);
    dayStart.setUTCHours(0, 0, 0, 0);

    // Night window 1: previous day's 21:00 to this day's 07:00
    const nightEnd = new Date(dayStart);
    nightEnd.setUTCHours(NIGHT_END_HOUR, 0, 0, 0);

    // Night window 2: this day's 21:00 to next day's 07:00
    const nightStart = new Date(dayStart);
    nightStart.setUTCHours(NIGHT_START_HOUR, 0, 0, 0);

    // Check overlap with early morning window (00:00 - 07:00)
    if (current < nightEnd) {
      const overlapStart = current > dayStart ? current : dayStart;
      const overlapEnd = clockOut < nightEnd ? clockOut : nightEnd;
      if (overlapStart < overlapEnd) {
        nightMinutes += Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000);
      }
    }

    // Check overlap with evening window (21:00 - 24:00)
    const nextDayStart = new Date(dayStart);
    nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

    if (current < nextDayStart && clockOut > nightStart) {
      const overlapStart = current > nightStart ? current : nightStart;
      const overlapEnd = clockOut < nextDayStart ? clockOut : nextDayStart;
      if (overlapStart < overlapEnd) {
        nightMinutes += Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000);
      }
    }

    // Move to next day
    current.setUTCDate(current.getUTCDate() + 1);
    current.setUTCHours(0, 0, 0, 0);
  }

  return nightMinutes;
}

/**
 * Calculate tardiness in minutes.
 * Returns 0 if within grace period.
 */
export function calculateTardiness(
  clockIn: Date,
  shiftStartTime: string, // "HH:mm"
  shiftDate: Date,
  gracePeriodMinutes: number,
): number {
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  const expectedStart = new Date(shiftDate);
  expectedStart.setUTCHours(hours, minutes, 0, 0);

  const diffMs = clockIn.getTime() - expectedStart.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes <= gracePeriodMinutes) {
    return 0;
  }

  return diffMinutes - gracePeriodMinutes;
}

/**
 * Given a shift start time string and a date, calculate the expected
 * clock-out DateTime (for auto-close purposes).
 */
export function calculateShiftEndDateTime(
  shiftDate: Date,
  startTime: string,
  endTime: string,
): Date {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const endDate = new Date(shiftDate);
  endDate.setUTCHours(endH, endM, 0, 0);

  // If end time is before start time, the shift crosses midnight
  if (endH < startH || (endH === startH && endM < startM)) {
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  }

  return endDate;
}

/**
 * Parse "HH:mm" time string into hours and minutes.
 */
export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}
