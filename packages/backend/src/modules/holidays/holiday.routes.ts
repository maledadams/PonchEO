import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../middleware/validate.middleware';
import {
  createHolidaySchema,
  holidayQuerySchema,
  idParamSchema,
  updateHolidaySchema,
  yearParamSchema,
} from './holiday.schema';
import * as holidayController from './holiday.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /holidays:
 *   get:
 *     summary: List holidays (optionally filter by year)
 *     tags: [Holidays]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of holidays
 */
router.get('/', validateQuery(holidayQuerySchema), holidayController.findAll);
router.get('/:id', validateParams(idParamSchema), holidayController.findById);
router.post('/', requireRole('SUPERVISOR'), validate(createHolidaySchema), holidayController.create);
router.put(
  '/:id',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(updateHolidaySchema),
  holidayController.update,
);
router.delete('/:id', requireRole('SUPERVISOR'), validateParams(idParamSchema), holidayController.remove);

/**
 * @swagger
 * /holidays/seed/{year}:
 *   post:
 *     summary: Seed Dominican Republic national holidays for a given year
 *     tags: [Holidays]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Holidays seeded
 */
router.post(
  '/seed/:year',
  requireRole('SUPERVISOR'),
  validateParams(yearParamSchema),
  holidayController.seedHolidays,
);

export default router;
