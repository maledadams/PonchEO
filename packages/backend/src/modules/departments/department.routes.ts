import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createDepartmentSchema, updateDepartmentSchema } from './department.schema';
import * as departmentController from './department.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: List all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('/', departmentController.findAll);
router.get('/:id', departmentController.findById);
router.post('/', requireRole('SUPERVISOR'), validate(createDepartmentSchema), departmentController.create);
router.put('/:id', requireRole('SUPERVISOR'), validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', requireRole('SUPERVISOR'), departmentController.remove);

export default router;
