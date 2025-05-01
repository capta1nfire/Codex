import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors.js';

export const validateBody = (schema: ZodSchema<any>) => async (req: Request, _res: Response, next: NextFunction) => {
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

// Nuevo middleware para validar req.params
export const validateParams = (schema: ZodSchema<any>) => async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Parsear y *no* sobrescribir req.params, ya que Express los trata como objetos con propiedades específicas.
    // Si quisiéramos sobreescribir/sanitizar, necesitaríamos hacerlo campo por campo.
    schema.parse(req.params); 
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.errors.map(e => ({ path: e.path.join('.'), message: e.message }));
      // Usar el mismo AppError que validateBody
      return next(new AppError('Error de validación en parámetros', 400, ErrorCode.VALIDATION_ERROR, { issues }));
    }
    next(error);
  }
}; 