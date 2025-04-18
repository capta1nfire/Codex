import { Request, Response, NextFunction } from 'express';
import { AppError, sendErrorResponse, ErrorCode, HttpStatus, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware para manejar rutas no encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(`Ruta no encontrada: ${req.originalUrl}`);
  
  // Usar NotFoundError en lugar de AppError directamente
  const error = new NotFoundError(`Ruta no encontrada: ${req.originalUrl}`);
  
  // Utilizar sendErrorResponse para mantener consistencia en el manejo de errores
  sendErrorResponse(res, error);
}

// Middleware para capturar y procesar todos los errores de la aplicación
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Registro de información de la solicitud para depuración
  logger.error('Error en la solicitud', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
    },
    ip: req.ip
  });

  return sendErrorResponse(res, error);
}

// Middleware para capturar excepciones asíncronas no manejadas
export function asyncErrorWrapper(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
} 