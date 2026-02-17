import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate, validateParams, validateQuery } from '../../middleware/validate.middleware';
import {
  createEmployeeSchema,
  employeeQuerySchema,
  idParamSchema,
  updateEmployeeSchema,
} from './employee.schema';
import * as employeeController from './employee.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive employees
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get('/', validateQuery(employeeQuerySchema), employeeController.findAll);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
router.get('/:id', validateParams(idParamSchema), employeeController.findById);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employeeCode, firstName, lastName, email, password, hireDate, hourlyRate]
 *             properties:
 *               employeeCode:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [EMPLOYEE, SUPERVISOR]
 *               departmentId:
 *                 type: integer
 *               hireDate:
 *                 type: string
 *                 format: date
 *               hourlyRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Employee created
 */
router.post(
  '/',
  requireRole('SUPERVISOR'),
  validate(createEmployeeSchema),
  employeeController.create,
);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an employee
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.put(
  '/:id',
  requireRole('SUPERVISOR'),
  validateParams(idParamSchema),
  validate(updateEmployeeSchema),
  employeeController.update,
);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Soft-delete an employee (set isActive = false)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deactivated
 */
router.delete('/:id', requireRole('SUPERVISOR'), validateParams(idParamSchema), employeeController.remove);

export default router;
