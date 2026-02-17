import prisma from '../../config/database';
import { Errors } from '../../shared/errors/AppError';
import { CreateHolidayInput } from './holiday.schema';

export async function findAll(year?: number) {
  if (year) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    return prisma.holiday.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }
  return prisma.holiday.findMany({ orderBy: { date: 'asc' } });
}

export async function findById(id: number) {
  const holiday = await prisma.holiday.findUnique({ where: { id } });
  if (!holiday) throw Errors.notFound('Holiday', id);
  return holiday;
}

export async function create(input: CreateHolidayInput) {
  return prisma.holiday.create({
    data: {
      date: new Date(input.date),
      name: input.name,
      isRecurring: input.isRecurring,
      year: input.year,
    },
  });
}

export async function update(id: number, input: Partial<CreateHolidayInput>) {
  await findById(id);
  return prisma.holiday.update({
    where: { id },
    data: {
      ...(input.date && { date: new Date(input.date) }),
      ...(input.name && { name: input.name }),
      ...(input.isRecurring !== undefined && { isRecurring: input.isRecurring }),
      ...(input.year !== undefined && { year: input.year }),
    },
  });
}

export async function remove(id: number) {
  await findById(id);
  return prisma.holiday.delete({ where: { id } });
}

/**
 * Seed Dominican Republic national holidays for a given year.
 * Based on Codigo de Trabajo and Constitution Art. 55.
 */
export async function seedDRHolidays(year: number) {
  const corpusChristiDate = formatAsIsoDate(getCorpusChristiDate(year));

  const holidays = [
    { date: `${year}-01-01`, name: 'Año Nuevo', isRecurring: true },
    { date: `${year}-01-06`, name: 'Día de los Santos Reyes', isRecurring: true },
    { date: `${year}-01-21`, name: 'Día de la Altagracia', isRecurring: true },
    { date: `${year}-01-26`, name: 'Día de Duarte', isRecurring: true },
    { date: `${year}-02-27`, name: 'Día de la Independencia', isRecurring: true },
    { date: `${year}-05-01`, name: 'Día del Trabajo', isRecurring: true },
    { date: corpusChristiDate, name: 'Corpus Christi', isRecurring: false, year },
    { date: `${year}-08-16`, name: 'Día de la Restauración', isRecurring: true },
    { date: `${year}-09-24`, name: 'Día de las Mercedes', isRecurring: true },
    { date: `${year}-11-06`, name: 'Día de la Constitución', isRecurring: true },
    { date: `${year}-12-25`, name: 'Navidad', isRecurring: true },
  ];

  const results = await prisma.holiday.createMany({
    data: holidays.map((h) => ({
      date: new Date(h.date),
      name: h.name,
      isRecurring: h.isRecurring,
      year: h.year || null,
    })),
    skipDuplicates: true,
  });

  return { created: results.count, total: holidays.length };
}

function getCorpusChristiDate(year: number): Date {
  const easterSunday = getEasterSunday(year);
  const corpusChristi = new Date(easterSunday);
  corpusChristi.setUTCDate(corpusChristi.getUTCDate() + 60);
  return corpusChristi;
}

function getEasterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatAsIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
