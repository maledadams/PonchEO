import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validateParams, validateQuery } from '../../middleware/validate.middleware';
import { idParamSchema, punchQuerySchema } from './punch.schema';
import * as punchController from './punch.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /punches/clock-in:
 *   post:
 *     summary: Clock in (employee ID from JWT)
 *     tags: [Punches]
 *     responses:
 *       201:
 *         description: Punch created (clocked in)
 *       409:
 *         description: Already has an open punch
 *       400:
 *         description: No shift assigned for today
 */
router.post('/clock-in', punchController.clockIn);

/**
 * @swagger
 * /punches/clock-out:
 *   post:
 *     summary: Clock out (employee ID from JWT)
 *     tags: [Punches]
 *     responses:
 *       200:
 *         description: Punch updated (clocked out)
 *       404:
 *         description: No open punch found
 */
router.post('/clock-out', punchController.clockOut);

/**
 * @swagger
 * /punches/open:
 *   get:
 *     summary: List all currently open punches (supervisor only)
 *     tags: [Punches]
 *     responses:
 *       200:
 *         description: List of open punches
 */
router.get('/open', requireRole('SUPERVISOR'), punchController.findOpen);

/**
 * @swagger
 * /punches:
 *   get:
 *     summary: List punches with filters
 *     tags: [Punches]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, AUTO_CLOSED, CORRECTED]
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
 *         description: List of punches
 */
router.get('/', validateQuery(punchQuerySchema), punchController.findAll);
router.get('/:id', validateParams(idParamSchema), punchController.findById);

export default router;
