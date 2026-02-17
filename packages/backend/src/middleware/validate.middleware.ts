import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { Errors } from '../shared/errors/AppError';

/**
 * Validates request body against a Zod schema.
 * On success, replaces req.body with the parsed (typed) result.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw Errors.validation(result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates request query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw Errors.validation(result.error.flatten().fieldErrors);
    }
    req.query = result.data;
    next();
  };
}

/**
 * Validates request params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw Errors.validation(result.error.flatten().fieldErrors);
    }
    req.params = result.data;
    next();
  };
}
