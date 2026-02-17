import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Errors } from '../shared/errors/AppError';

interface JwtPayload {
  id: number;
  role: 'EMPLOYEE' | 'SUPERVISOR';
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw Errors.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    throw Errors.unauthorized('Invalid or expired token');
  }
}

export function requireRole(...roles: ('EMPLOYEE' | 'SUPERVISOR')[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw Errors.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw Errors.forbidden(`This action requires one of: ${roles.join(', ')}`);
    }
    next();
  };
}
