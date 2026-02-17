export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common error factories
export const Errors = {
  validation: (details: unknown) =>
    new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details),
  unauthorized: (message = 'Authentication required') =>
    new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Insufficient permissions') =>
    new AppError(403, 'FORBIDDEN', message),
  notFound: (entity: string, id?: number | string) =>
    new AppError(404, `${entity.toUpperCase()}_NOT_FOUND`, `${entity} not found${id ? `: ${id}` : ''}`),
  conflict: (code: string, message: string, details?: unknown) =>
    new AppError(409, code, message, details),
};
