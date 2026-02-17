import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../middleware/validate.middleware';
import { generatePayrollSchema, idParamSchema, payrollQuerySchema } from './payroll.schema';
import * as payrollController from './payroll.controller';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('SUPERVISOR'));

/**
 * @swagger
 * /payroll/generate:
 *   post:
 *     summary: Generate payroll for a period (supervisor only)
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [periodStart, periodEnd, periodType]
 *             properties:
 *               periodStart:
 *                 type: string
 *                 format: date
 *               periodEnd:
 *                 type: string
 *                 format: date
 *               periodType:
 *                 type: string
 *                 enum: [WEEKLY, BIWEEKLY]
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Payroll summaries generated
 */
router.post('/generate', validate(generatePayrollSchema), payrollController.generate);

/**
 * @swagger
 * /payroll/export/csv:
 *   get:
 *     summary: Export payroll summaries as CSV
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: periodStart
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodEnd
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, FINALIZED]
 *     responses:
 *       200:
 *         description: CSV file
 */
router.get('/export/csv', validateQuery(payrollQuerySchema), payrollController.exportCsv);

/**
 * @swagger
 * /payroll:
 *   get:
 *     summary: List payroll summaries
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: List of payroll summaries
 */
router.get('/', validateQuery(payrollQuerySchema), payrollController.findAll);
router.get('/:id', validateParams(idParamSchema), payrollController.findById);

/**
 * @swagger
 * /payroll/{id}/finalize:
 *   put:
 *     summary: Lock payroll summary
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: Payroll finalized
 */
router.put('/:id/finalize', validateParams(idParamSchema), payrollController.finalize);

/**
 * @swagger
 * /payroll/{id}/revert:
 *   put:
 *     summary: Revert payroll to draft
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: Payroll reverted to draft
 */
router.put('/:id/revert', validateParams(idParamSchema), payrollController.revert);

export default router;
