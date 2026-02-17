import { describe, expect, it } from 'vitest';
import {
  calculateNightMinutes,
  calculateShiftEndDateTime,
  calculateWorkedMinutes,
} from './time.utils';

describe('time utils', () => {
  it('calculates worked minutes with break deduction', () => {
    const clockIn = new Date('2026-02-16T08:00:00.000Z');
    const clockOut = new Date('2026-02-16T16:00:00.000Z');
    expect(calculateWorkedMinutes(clockIn, clockOut, 60)).toBe(420);
  });

  it('calculates night minutes across midnight', () => {
    const clockIn = new Date('2026-02-16T22:00:00.000Z');
    const clockOut = new Date('2026-02-17T05:00:00.000Z');
    expect(calculateNightMinutes(clockIn, clockOut)).toBe(420);
  });

  it('detects shift end on next day when crossing midnight', () => {
    const shiftDate = new Date('2026-02-16T00:00:00.000Z');
    const end = calculateShiftEndDateTime(shiftDate, '22:00', '06:00');
    expect(end.toISOString()).toBe('2026-02-17T06:00:00.000Z');
  });
});
