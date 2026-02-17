import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response.utils';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('SUPERVISOR'));

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: List audit logs (supervisor only)
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
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
 *         description: List of audit log entries
 */
router.get('/', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(req.query.userId && { userId: Number(req.query.userId) }),
        ...(req.query.entityType && { entityType: req.query.entityType as string }),
        ...(req.query.entityId && { entityId: Number(req.query.entityId) }),
        ...(req.query.startDate &&
          req.query.endDate && {
            timestamp: {
              gte: new Date(req.query.startDate as string),
              lte: new Date((req.query.endDate as string) + 'T23:59:59.999Z'),
            },
          }),
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    sendSuccess(res, logs);
  } catch (err) {
    next(err);
  }
});

export default router;
