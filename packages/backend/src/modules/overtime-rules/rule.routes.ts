import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams } from '../../middleware/validate.middleware';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response.utils';
import { Errors } from '../../shared/errors/AppError';
import { idParamSchema, updateOvertimeRuleSchema } from './rule.schema';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /overtime-rules:
 *   get:
 *     summary: List all overtime rules
 *     tags: [Overtime Rules]
 *     responses:
 *       200:
 *         description: List of overtime rules
 */
router.get('/', async (_req, res, next) => {
  try {
    const rules = await prisma.overtimeRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
    sendSuccess(res, rules);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    const rule = await prisma.overtimeRule.findUnique({ where: { id: Number(req.params.id) } });
    if (!rule) throw Errors.notFound('OvertimeRule', Number(req.params.id));
    sendSuccess(res, rule);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /overtime-rules/{id}:
 *   put:
 *     summary: Update an overtime rule (supervisor only)
 *     tags: [Overtime Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.put(
  '/:id',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(updateOvertimeRuleSchema),
  async (req, res, next) => {
  try {
    const rule = await prisma.overtimeRule.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    sendSuccess(res, rule);
  } catch (err) {
    next(err);
  }
});

export default router;
