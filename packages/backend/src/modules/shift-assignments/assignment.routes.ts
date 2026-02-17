import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../middleware/validate.middleware';
import {
  assignmentQuerySchema,
  bulkAssignmentSchema,
  createAssignmentSchema,
  idParamSchema,
  updateAssignmentSchema,
} from './assignment.schema';
import * as assignmentController from './assignment.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /shift-assignments:
 *   get:
 *     summary: List shift assignments (filter by employeeId, startDate, endDate)
 *     tags: [Shift Assignments]
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
 *         description: List of shift assignments
 */
router.get('/', validateQuery(assignmentQuerySchema), assignmentController.findAll);
router.get('/:id', validateParams(idParamSchema), assignmentController.findById);

/**
 * @swagger
 * /shift-assignments:
 *   post:
 *     summary: Create a single shift assignment
 *     tags: [Shift Assignments]
 *     responses:
 *       201:
 *         description: Assignment created
 */
router.post('/', requireRole('SUPERVISOR'), validate(createAssignmentSchema), assignmentController.create);

/**
 * @swagger
 * /shift-assignments/bulk:
 *   post:
 *     summary: Bulk create shift assignments for a date range and days of week
 *     tags: [Shift Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeId, shiftTemplateId, startDate, endDate, daysOfWeek]
 *             properties:
 *               employeeId:
 *                 type: integer
 *               shiftTemplateId:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 6
 *     responses:
 *       201:
 *         description: Bulk assignments created
 */
router.post('/bulk', requireRole('SUPERVISOR'), validate(bulkAssignmentSchema), assignmentController.bulkCreate);

router.put(
  '/:id',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(updateAssignmentSchema),
  assignmentController.update,
);
router.delete('/:id', requireRole('SUPERVISOR'), validateParams(idParamSchema), assignmentController.remove);

export default router;
