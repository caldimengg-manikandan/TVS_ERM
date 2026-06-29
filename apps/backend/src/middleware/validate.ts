import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidateTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      (result.error as ZodError).errors.forEach((err) => {
        const key = err.path.join('.') || 'general';
        if (!errors[key]) errors[key] = [];
        errors[key].push(err.message);
      });
      sendValidationError(res, errors);
      return;
    }

    req[target] = result.data;
    next();
  };
};

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
