import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createShiftSchema, updateShiftSchema } from './shift.schema';
import * as shiftController from './shift.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /shift-templates:
 *   get:
 *     summary: List all shift templates
 *     tags: [Shift Templates]
 *     responses:
 *       200:
 *         description: List of shift templates
 */
router.get('/', shiftController.findAll);
router.get('/:id', shiftController.findById);
router.post('/', requireRole('SUPERVISOR'), validate(createShiftSchema), shiftController.create);
router.put('/:id', requireRole('SUPERVISOR'), validate(updateShiftSchema), shiftController.update);
router.delete('/:id', requireRole('SUPERVISOR'), shiftController.remove);

export default router;
