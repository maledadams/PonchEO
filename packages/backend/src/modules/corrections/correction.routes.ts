import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../middleware/validate.middleware';
import {
  correctionQuerySchema,
  createCorrectionSchema,
  idParamSchema,
  reviewCorrectionSchema,
} from './correction.schema';
import * as correctionController from './correction.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /corrections:
 *   get:
 *     summary: List corrections (filter by status, employeeId)
 *     tags: [Corrections]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of corrections
 */
router.get('/', validateQuery(correctionQuerySchema), correctionController.findAll);
router.get('/:id', validateParams(idParamSchema), correctionController.findById);

/**
 * @swagger
 * /corrections:
 *   post:
 *     summary: Create a correction request
 *     tags: [Corrections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [punchId, correctedClockIn, reason]
 *             properties:
 *               punchId:
 *                 type: integer
 *               correctedClockIn:
 *                 type: string
 *                 format: date-time
 *               correctedClockOut:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *                 minLength: 5
 *     responses:
 *       201:
 *         description: Correction created
 */
router.post(
  '/',
  requireRole('EMPLOYEE'),
  validate(createCorrectionSchema),
  correctionController.create,
);

/**
 * @swagger
 * /corrections/{id}/approve:
 *   post:
 *     summary: Approve a correction (supervisor only)
 *     tags: [Corrections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Correction approved, punch updated
 */
router.post(
  '/:id/approve',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(reviewCorrectionSchema),
  correctionController.approve,
);

/**
 * @swagger
 * /corrections/{id}/reject:
 *   post:
 *     summary: Reject a correction (supervisor only)
 *     tags: [Corrections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Correction rejected
 */
router.post(
  '/:id/reject',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(reviewCorrectionSchema),
  correctionController.reject,
);

export default router;
