import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Departments ──────────────────────────────────────────────────────────
  const warehouse = await prisma.department.upsert({
    where: { name: 'Almacén' },
    update: {},
    create: { name: 'Almacén' },
  });

  const admin = await prisma.department.upsert({
    where: { name: 'Administración' },
    update: {},
    create: { name: 'Administración' },
  });

  const sales = await prisma.department.upsert({
    where: { name: 'Ventas' },
    update: {},
    create: { name: 'Ventas' },
  });

  console.log('  ✓ Departments created');

  // ─── Shift Templates ─────────────────────────────────────────────────────
  const morningShift = await prisma.shiftTemplate.upsert({
    where: { name: 'Mañana' },
    update: {},
    create: {
      name: 'Mañana',
      startTime: '08:00',
      endTime: '16:00',
      shiftType: 'DIURNA',
      breakMinutes: 60,
      gracePeriodMinutes: 10,
    },
  });

  const afternoonShift = await prisma.shiftTemplate.upsert({
    where: { name: 'Tarde' },
    update: {},
    create: {
      name: 'Tarde',
      startTime: '14:00',
      endTime: '22:00',
      shiftType: 'MIXTA',
      breakMinutes: 60,
      gracePeriodMinutes: 10,
    },
  });

  const nightShift = await prisma.shiftTemplate.upsert({
    where: { name: 'Nocturno' },
    update: {},
    create: {
      name: 'Nocturno',
      startTime: '22:00',
      endTime: '06:00',
      shiftType: 'NOCTURNA',
      breakMinutes: 60,
      gracePeriodMinutes: 15,
    },
  });

  const splitShift = await prisma.shiftTemplate.upsert({
    where: { name: 'Medio Día' },
    update: {},
    create: {
      name: 'Medio Día',
      startTime: '09:00',
      endTime: '13:00',
      shiftType: 'DIURNA',
      breakMinutes: 0,
      gracePeriodMinutes: 5,
    },
  });

  console.log('  ✓ Shift templates created');

  // ─── Overtime Rules (Dominican Republic - Ley 16-92) ──────────────────────
  const overtimeRules = [
    {
      name: 'Standard Rate',
      description: 'First 44 hours per week at normal rate (Ley 16-92, Art. 147)',
      thresholdMinutes: 0,
      maxMinutes: 2640, // 44h * 60
      multiplier: 1.0,
      priority: 1,
    },
    {
      name: 'Standard Overtime',
      description: 'Hours 44-68 per week at 135% (Ley 16-92, Art. 203)',
      thresholdMinutes: 2640,
      maxMinutes: 4080, // 68h * 60
      multiplier: 1.35,
      priority: 2,
    },
    {
      name: 'Excessive Overtime',
      description: 'Beyond 68 hours per week at 200% (Ley 16-92, Art. 203)',
      thresholdMinutes: 4080,
      maxMinutes: null,
      multiplier: 2.0,
      priority: 3,
    },
    {
      name: 'Night Premium',
      description: 'Night shift (9PM-7AM) 15% premium (Ley 16-92, Art. 204)',
      thresholdMinutes: null,
      maxMinutes: null,
      multiplier: 1.15,
      priority: 4,
    },
    {
      name: 'Holiday Work',
      description: 'Work on national holidays at 200% (Ley 16-92)',
      thresholdMinutes: null,
      maxMinutes: null,
      multiplier: 2.0,
      priority: 5,
    },
    {
      name: 'Rest Day Work',
      description: 'Work on designated rest day at 200% (Ley 16-92)',
      thresholdMinutes: null,
      maxMinutes: null,
      multiplier: 2.0,
      priority: 6,
    },
  ];

  for (const rule of overtimeRules) {
    await prisma.overtimeRule.upsert({
      where: { name: rule.name },
      update: {},
      create: rule,
    });
  }

  console.log('  ✓ Overtime rules created (DR Ley 16-92)');

  // ─── Holidays (Dominican Republic 2026) ───────────────────────────────────
  const corpusChristi2026 = formatAsIsoDate(getCorpusChristiDate(2026));
  const holidays2026 = [
    { date: '2026-01-01', name: 'Año Nuevo' },
    { date: '2026-01-06', name: 'Día de los Santos Reyes' },
    { date: '2026-01-21', name: 'Día de la Altagracia' },
    { date: '2026-01-26', name: 'Día de Duarte' },
    { date: '2026-02-27', name: 'Día de la Independencia' },
    { date: '2026-05-01', name: 'Día del Trabajo' },
    { date: corpusChristi2026, name: 'Corpus Christi' },
    { date: '2026-08-16', name: 'Día de la Restauración' },
    { date: '2026-09-24', name: 'Día de las Mercedes' },
    { date: '2026-11-06', name: 'Día de la Constitución' },
    { date: '2026-12-25', name: 'Navidad' },
  ];

  for (const holiday of holidays2026) {
    const dateObj = new Date(holiday.date);
    await prisma.holiday.upsert({
      where: { date: dateObj },
      update: {},
      create: {
        date: dateObj,
        name: holiday.name,
        isRecurring: true,
      },
    });
  }

  console.log('  ✓ Holidays 2026 created (DR national holidays)');

  // ─── Demo Employees ───────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const supervisor = await prisma.employee.upsert({
    where: { email: 'supervisor@poncheo.com' },
    update: {},
    create: {
      employeeCode: 'EMP-001',
      firstName: 'María',
      lastName: 'González',
      email: 'supervisor@poncheo.com',
      passwordHash,
      role: 'SUPERVISOR',
      departmentId: admin.id,
      hireDate: new Date('2024-01-15'),
      hourlyRate: 350.0,
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { email: 'carlos@poncheo.com' },
    update: {},
    create: {
      employeeCode: 'EMP-002',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos@poncheo.com',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: warehouse.id,
      hireDate: new Date('2024-06-01'),
      hourlyRate: 200.0,
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { email: 'ana@poncheo.com' },
    update: {},
    create: {
      employeeCode: 'EMP-003',
      firstName: 'Ana',
      lastName: 'Martínez',
      email: 'ana@poncheo.com',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: sales.id,
      hireDate: new Date('2025-01-10'),
      hourlyRate: 225.0,
    },
  });

  const emp4 = await prisma.employee.upsert({
    where: { email: 'juan@poncheo.com' },
    update: {},
    create: {
      employeeCode: 'EMP-004',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@poncheo.com',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: warehouse.id,
      hireDate: new Date('2025-03-20'),
      hourlyRate: 200.0,
    },
  });

  const emp5 = await prisma.employee.upsert({
    where: { email: 'lucia@poncheo.com' },
    update: {},
    create: {
      employeeCode: 'EMP-005',
      firstName: 'Lucía',
      lastName: 'Hernández',
      email: 'lucia@poncheo.com',
      passwordHash,
      role: 'EMPLOYEE',
      departmentId: admin.id,
      hireDate: new Date('2025-08-01'),
      hourlyRate: 250.0,
    },
  });

  console.log('  ✓ Demo employees created (password: password123)');

  // ─── Shift Assignments (2 weeks of demo data) ────────────────────────────
  const employees = [
    { emp: emp2, shift: morningShift },
    { emp: emp3, shift: morningShift },
    { emp: emp4, shift: nightShift },
    { emp: emp5, shift: afternoonShift },
    { emp: supervisor, shift: morningShift },
  ];

  // Generate assignments for the current week and next week
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startOfWeek = new Date(today);
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay() + 1); // Monday

  for (const { emp, shift } of employees) {
    for (let week = 0; week < 2; week++) {
      for (let day = 0; day < 5; day++) {
        // Mon-Fri
        const date = new Date(startOfWeek);
        date.setUTCDate(date.getUTCDate() + week * 7 + day);

        try {
          await prisma.shiftAssignment.create({
            data: {
              employeeId: emp.id,
              shiftTemplateId: shift.id,
              date,
            },
          });
        } catch {
          // Skip duplicates silently
        }
      }
    }
  }

  console.log('  ✓ Shift assignments created (2 weeks)');

  console.log('\nSeed completed successfully!');
  console.log('\nDemo Credentials:');
  console.log('  Supervisor: supervisor@poncheo.com / password123');
  console.log('  Employee:   carlos@poncheo.com / password123');
  console.log('  Employee:   ana@poncheo.com / password123');
  console.log('  Employee:   juan@poncheo.com / password123');
  console.log('  Employee:   lucia@poncheo.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

function getCorpusChristiDate(year: number): Date {
  const easterSunday = getEasterSunday(year);
  const corpusChristi = new Date(easterSunday);
  corpusChristi.setUTCDate(corpusChristi.getUTCDate() + 60);
  return corpusChristi;
}

function getEasterSunday(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatAsIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
