import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error(`Error on ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    userId: req.user?.userId,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.') || 'general';
      if (!errors[key]) errors[key] = [];
      errors[key].push(e.message);
    });
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  // Prisma errors
  if (err.message?.includes('Unique constraint failed')) {
    res.status(409).json({ success: false, message: 'Resource already exists' });
    return;
  }

  if (err.message?.includes('Foreign key constraint failed')) {
    res.status(400).json({ success: false, message: 'Referenced resource not found' });
    return;
  }

  if (err.message?.includes('Record to update not found')) {
    res.status(404).json({ success: false, message: 'Resource not found' });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired', error: 'TOKEN_EXPIRED' });
    return;
  }

  // CSRF errors
  if ((err as any).code === 'EBADCSRFTOKEN') {
    res.status(403).json({ success: false, message: 'Invalid CSRF token' });
    return;
  }

  // Operational errors
  const appError = err as AppError;
  if (appError.isOperational) {
    res.status(appError.statusCode || 400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unexpected errors - don't leak details in production
  const statusCode = appError.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
