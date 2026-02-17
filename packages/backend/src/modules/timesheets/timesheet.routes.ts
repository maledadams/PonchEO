import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response.utils';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /daily-timesheets:
 *   get:
 *     summary: List daily timesheets (filter by employeeId, date range)
 *     tags: [Timesheets]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of daily timesheets
 */
router.get('/', async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Employees can only see their own timesheets
    const effectiveEmployeeId = req.user!.role === 'SUPERVISOR' ? employeeId : req.user!.id;

    const timesheets = await prisma.dailyTimesheet.findMany({
      where: {
        ...(effectiveEmployeeId && { employeeId: effectiveEmployeeId }),
        ...(startDate &&
          endDate && {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
    sendSuccess(res, timesheets);
  } catch (err) {
    next(err);
  }
});

export default router;
