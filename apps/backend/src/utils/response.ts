import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@tvs/shared';
import { logger } from './logger';

export type ApiResponseType<T = unknown> = ApiResponse<T>;

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  } as ApiResponseType<T>);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  } as ApiResponseType);
};

export const sendValidationError = (res: Response, errors: Record<string, string[]>): Response => {
  return res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors,
  } as ApiResponseType);
};

export const handleZodError = (res: Response, error: ZodError): Response => {
  const errors: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const key = err.path.join('.') || 'general';
    if (!errors[key]) errors[key] = [];
    errors[key].push(err.message);
  });
  return sendValidationError(res, errors);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: (err?: unknown) => void) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: (err?: unknown) => void): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error('Async handler error:', err);
      next(err);
    });
  };
};

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const buildPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> => ({
  data,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  },
});

export const getPaginationParams = (page = 1, limit = 25) => ({
  skip: (page - 1) * limit,
  take: limit,
});
