import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors.js';

export const validateBody = (schema: ZodSchema<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      return next(new AppError('Error de validación', 400, ErrorCode.VALIDATION_ERROR, { issues }));
    }
    next(error);
  }
}; 