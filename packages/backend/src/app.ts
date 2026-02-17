import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { runAutoCloseJobOnce } from './jobs/autoClosePunches.job';
import { auditMiddleware } from './middleware/audit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { swaggerSpec } from './config/swagger';

import assignmentRoutes from './modules/shift-assignments/assignment.routes';
import auditRoutes from './modules/audit/audit.routes';
import authRoutes from './modules/auth/auth.routes';
import correctionRoutes from './modules/corrections/correction.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import departmentRoutes from './modules/departments/department.routes';
import employeeRoutes from './modules/employees/employee.routes';
import holidayRoutes from './modules/holidays/holiday.routes';
import overtimeRuleRoutes from './modules/overtime-rules/rule.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import punchRoutes from './modules/punches/punch.routes';
import shiftRoutes from './modules/shifts/shift.routes';
import timesheetRoutes from './modules/timesheets/timesheet.routes';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(auditMiddleware);

app.use(
  '/api-docs',
  ...(swaggerUi.serve as unknown as express.RequestHandler[]),
  swaggerUi.setup(swaggerSpec) as unknown as express.RequestHandler,
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/shift-templates', shiftRoutes);
app.use('/api/shift-assignments', assignmentRoutes);
app.use('/api/punches', punchRoutes);
app.use('/api/corrections', correctionRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/overtime-rules', overtimeRuleRoutes);
app.use('/api/daily-timesheets', timesheetRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// For serverless deployments (Vercel Cron or external scheduler).
app.post('/api/jobs/auto-close', async (req, res, next) => {
  try {
    const providedSecretHeader = req.headers['x-cron-secret'];
    const providedSecret = typeof providedSecretHeader === 'string' ? providedSecretHeader : undefined;
    const authorizationHeader = req.headers.authorization;
    const bearerToken =
      typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')
        ? authorizationHeader.slice('Bearer '.length).trim()
        : undefined;
    const expectedSecret = env.CRON_SECRET;

    const isAuthorized =
      !!expectedSecret &&
      (providedSecret === expectedSecret || bearerToken === expectedSecret);

    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid cron credentials',
        },
      });
    }

    const closed = await runAutoCloseJobOnce();
    return res.status(200).json({
      success: true,
      data: { closed },
    });
  } catch (err) {
    return next(err);
  }
});

app.use(errorMiddleware);

export default app;
