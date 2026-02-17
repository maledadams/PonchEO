import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

/**
 * Audit middleware that logs all mutating operations (POST, PUT, PATCH, DELETE).
 * Captures the response payload and writes logs asynchronously.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function patchedJson(data: unknown) {
    setImmediate(() => {
      const userId = req.user?.id;
      if (!userId) return;

      const action = methodToAction(req.method);
      const entityType = extractEntityType(req.path);
      const entityId =
        extractEntityIdFromResponse(data) ??
        extractEntityIdFromPath(req.originalUrl) ??
        -1;

      prisma.auditLog
        .create({
          data: {
            userId,
            action,
            entityType,
            entityId,
            oldValues: req.originalEntityState ? (req.originalEntityState as any) : undefined,
            newValues: extractDataPayload(data),
            ipAddress: req.ip || req.socket.remoteAddress,
          },
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'unknown error';
          console.error('Failed to write audit log:', message);
        });
    });

    return originalJson(data);
  };

  next();
}

function methodToAction(method: string): string {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return method;
  }
}

function extractEntityType(path: string): string {
  const segments = path.replace('/api/', '').split('/');
  const resource = segments[0];

  const entityMap: Record<string, string> = {
    employees: 'Employee',
    departments: 'Department',
    'shift-templates': 'ShiftTemplate',
    'shift-assignments': 'ShiftAssignment',
    punches: 'Punch',
    corrections: 'Correction',
    approvals: 'Approval',
    holidays: 'Holiday',
    'overtime-rules': 'OvertimeRule',
    'daily-timesheets': 'DailyTimesheet',
    payroll: 'PayrollSummary',
    auth: 'Auth',
  };

  return entityMap[resource] || resource;
}

function extractDataPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object') return undefined;
  return (data as { data?: unknown }).data;
}

function extractEntityIdFromResponse(data: unknown): number | null {
  const payload = extractDataPayload(data);
  if (!payload || typeof payload !== 'object') return null;

  const id = (payload as { id?: unknown }).id;
  if (typeof id === 'number' && Number.isFinite(id)) return id;

  return null;
}

function extractEntityIdFromPath(originalUrl: string): number | null {
  const cleanPath = originalUrl.split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);
  const firstNumericSegment = segments.find((segment) => /^\d+$/.test(segment));
  if (!firstNumericSegment) return null;

  const parsed = Number.parseInt(firstNumericSegment, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
