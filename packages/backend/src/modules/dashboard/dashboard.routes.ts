import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response.utils';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /dashboard/supervisor:
 *   get:
 *     summary: Supervisor dashboard stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/supervisor', requireRole('SUPERVISOR'), async (_req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [openPunches, pendingCorrections, autoClosedToday, activeEmployees] = await Promise.all([
      prisma.punch.count({ where: { status: 'OPEN' } }),
      prisma.correction.count({ where: { status: 'PENDING' } }),
      prisma.punch.count({
        where: {
          status: 'AUTO_CLOSED',
          updatedAt: { gte: today },
        },
      }),
      prisma.employee.count({ where: { isActive: true } }),
    ]);

    sendSuccess(res, {
      openPunches,
      pendingCorrections,
      autoClosedToday,
      activeEmployees,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /dashboard/employee:
 *   get:
 *     summary: Employee personal dashboard stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Employee dashboard statistics
 */
router.get('/employee', async (req, res, next) => {
  try {
    const employeeId = req.user!.id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // Start of week (Sunday)

    const [todayPunch, weekTimesheets, pendingCorrections] = await Promise.all([
      prisma.punch.findFirst({
        where: { employeeId, clockIn: { gte: today } },
        orderBy: { clockIn: 'desc' },
      }),
      prisma.dailyTimesheet.findMany({
        where: {
          employeeId,
          date: { gte: weekStart, lte: today },
        },
      }),
      prisma.correction.count({
        where: { requestedById: employeeId, status: 'PENDING' },
      }),
    ]);

    const weekTotalMinutes = weekTimesheets.reduce(
      (sum: number, ts: { totalWorkedMinutes: number }) => sum + ts.totalWorkedMinutes,
      0,
    );

    sendSuccess(res, {
      todayStatus: todayPunch?.status || 'NOT_CLOCKED_IN',
      todayClockIn: todayPunch?.clockIn || null,
      weekWorkedHours: Math.round((weekTotalMinutes / 60) * 100) / 100,
      pendingCorrections,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
