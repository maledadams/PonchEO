import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import { AppError, Errors } from '../../shared/errors/AppError';
import { GeneratePayrollInput } from './payroll.schema';

/**
 * Payroll Calculation Engine
 * Implements Dominican Republic labor code (Ley 16-92):
 * - Standard: first 44h/week at 1.00x
 * - Overtime: 44-68h at 1.35x
 * - Excessive: 68h+ at 2.00x
 * - Night premium: 15% on night hours
 * - Holiday/rest day: 200%
 */

interface OvertimeRuleData {
  name: string;
  thresholdMinutes: number | null;
  maxMinutes: number | null;
  multiplier: Decimal;
}

function findRule(rules: OvertimeRuleData[], name: string): OvertimeRuleData {
  const rule = rules.find((r) => r.name === name);
  if (!rule) {
    throw new AppError(
      500,
      'OVERTIME_RULE_MISSING',
      `Overtime rule "${name}" not found in database`,
    );
  }
  return rule;
}

export async function generatePayroll(input: GeneratePayrollInput, generatedById: number) {
  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);

  // Get employees to process
  let employees;
  if (input.employeeIds && input.employeeIds.length > 0) {
    employees = await prisma.employee.findMany({
      where: { id: { in: input.employeeIds }, isActive: true },
    });
  } else {
    employees = await prisma.employee.findMany({ where: { isActive: true } });
  }

  // Load overtime rules
  const rules = await prisma.overtimeRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
  });

  const standardRule = findRule(rules, 'Standard Rate');
  const overtimeRule = findRule(rules, 'Standard Overtime');
  const excessiveRule = findRule(rules, 'Excessive Overtime');
  const nightRule = findRule(rules, 'Night Premium');
  const holidayRule = findRule(rules, 'Holiday Work');
  const restDayRule = findRule(rules, 'Rest Day Work');

  const standardThreshold = standardRule.thresholdMinutes || 2640; // 44h
  const overtimeMax = overtimeRule.maxMinutes || 4080; // 68h

  const summaries = [];

  for (const employee of employees) {
    // Get all daily timesheets for the period
    const timesheets = await prisma.dailyTimesheet.findMany({
      where: {
        employeeId: employee.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    // Sum totals
    let totalWorkedMinutes = 0;
    let totalNightMinutes = 0;
    let totalHolidayMinutes = 0;
    let totalRestDayMinutes = 0;
    let totalTardinessMinutes = 0;

    for (const ts of timesheets) {
      totalWorkedMinutes += ts.totalWorkedMinutes;
      totalNightMinutes += ts.nightMinutes;
      totalTardinessMinutes += ts.tardinessMinutes;
      if (ts.isHoliday) {
        totalHolidayMinutes += ts.totalWorkedMinutes;
      }
      if (ts.isRestDay) {
        totalRestDayMinutes += ts.totalWorkedMinutes;
      }
    }

    // Classify minutes into buckets
    const regularMinutes = Math.min(totalWorkedMinutes, standardThreshold);
    const overtimeMinutes = Math.min(
      Math.max(totalWorkedMinutes - standardThreshold, 0),
      overtimeMax - standardThreshold,
    );
    const excessiveMinutes = Math.max(totalWorkedMinutes - overtimeMax, 0);

    // Calculate pay
    const hourlyRate = Number(employee.hourlyRate);
    const minuteRate = hourlyRate / 60;

    const regularPay = regularMinutes * minuteRate * 1.0;
    const overtimePay =
      overtimeMinutes * minuteRate * Number(overtimeRule.multiplier) +
      excessiveMinutes * minuteRate * Number(excessiveRule.multiplier);
    const nightPremiumPay = totalNightMinutes * minuteRate * (Number(nightRule.multiplier) - 1);
    const holidayPremiumPay = totalHolidayMinutes * minuteRate * (Number(holidayRule.multiplier) - 1);
    const restDayPremiumPay = totalRestDayMinutes * minuteRate * (Number(restDayRule.multiplier) - 1);
    const holidayPay = holidayPremiumPay + restDayPremiumPay;
    const grossPay = regularPay + overtimePay + nightPremiumPay + holidayPay;

    // Round to 2 decimal places
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const summary = await prisma.payrollSummary.upsert({
      where: {
        employeeId_periodStart_periodEnd: {
          employeeId: employee.id,
          periodStart,
          periodEnd,
        },
      },
      create: {
        employeeId: employee.id,
        periodStart,
        periodEnd,
        periodType: input.periodType,
        totalWorkedMinutes,
        regularMinutes,
        overtimeMinutes: overtimeMinutes + excessiveMinutes,
        nightMinutes: totalNightMinutes,
        holidayMinutes: totalHolidayMinutes + totalRestDayMinutes,
        totalTardinessMinutes,
        regularPay: round2(regularPay),
        overtimePay: round2(overtimePay),
        nightPremiumPay: round2(nightPremiumPay),
        holidayPay: round2(holidayPay),
        grossPay: round2(grossPay),
        generatedById,
        status: 'DRAFT',
      },
      update: {
        totalWorkedMinutes,
        regularMinutes,
        overtimeMinutes: overtimeMinutes + excessiveMinutes,
        nightMinutes: totalNightMinutes,
        holidayMinutes: totalHolidayMinutes + totalRestDayMinutes,
        totalTardinessMinutes,
        regularPay: round2(regularPay),
        overtimePay: round2(overtimePay),
        nightPremiumPay: round2(nightPremiumPay),
        holidayPay: round2(holidayPay),
        grossPay: round2(grossPay),
        generatedById,
        status: 'DRAFT',
      },
    });

    summaries.push(summary);
  }

  return summaries;
}

export async function findAll(filters: {
  periodStart?: string;
  periodEnd?: string;
  status?: string;
}) {
  return prisma.payrollSummary.findMany({
    where: {
      ...(filters.periodStart && { periodStart: new Date(filters.periodStart) }),
      ...(filters.periodEnd && { periodEnd: new Date(filters.periodEnd) }),
      ...(filters.status && { status: filters.status as any }),
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [{ employee: { lastName: 'asc' } }],
  });
}

export async function exportCsv(filters: {
  periodStart?: string;
  periodEnd?: string;
  status?: string;
}) {
  const summaries = await findAll(filters);
  type SummaryRow = Awaited<ReturnType<typeof findAll>>[number];

  const headers = [
    'employeeCode',
    'employeeName',
    'department',
    'periodStart',
    'periodEnd',
    'status',
    'totalWorkedMinutes',
    'regularMinutes',
    'overtimeMinutes',
    'nightMinutes',
    'holidayMinutes',
    'totalTardinessMinutes',
    'regularPay',
    'overtimePay',
    'nightPremiumPay',
    'holidayPay',
    'grossPay',
  ];

  const rows: Array<Array<string | number>> = summaries.map((summary: SummaryRow) => {
    const employeeName = `${summary.employee.firstName} ${summary.employee.lastName}`.trim();
    return [
      summary.employee.employeeCode,
      employeeName,
      summary.employee.department?.name || '',
      summary.periodStart.toISOString().slice(0, 10),
      summary.periodEnd.toISOString().slice(0, 10),
      summary.status,
      summary.totalWorkedMinutes,
      summary.regularMinutes,
      summary.overtimeMinutes,
      summary.nightMinutes,
      summary.holidayMinutes,
      summary.totalTardinessMinutes,
      Number(summary.regularPay).toFixed(2),
      Number(summary.overtimePay).toFixed(2),
      Number(summary.nightPremiumPay).toFixed(2),
      Number(summary.holidayPay).toFixed(2),
      Number(summary.grossPay).toFixed(2),
    ];
  });

  const csvLines = [
    headers.join(','),
    ...rows.map((row: Array<string | number>) => row.map(csvEscape).join(',')),
  ];

  return csvLines.join('\n');
}

export async function findById(id: number) {
  const summary = await prisma.payrollSummary.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          hourlyRate: true,
          department: { select: { name: true } },
        },
      },
    },
  });
  if (!summary) throw Errors.notFound('PayrollSummary', id);
  return summary;
}

export async function finalize(id: number) {
  return prisma.payrollSummary.update({
    where: { id },
    data: { status: 'FINALIZED' },
  });
}

export async function revert(id: number) {
  return prisma.payrollSummary.update({
    where: { id },
    data: { status: 'DRAFT' },
  });
}

function csvEscape(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
