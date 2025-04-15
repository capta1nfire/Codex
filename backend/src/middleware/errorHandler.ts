import { Request, Response, NextFunction } from 'express';
import { AppError, sendErrorResponse, ErrorCode } from '../utils/errors';
import logger from '../utils/logger';

// Middleware para capturar errores de rutas inexistentes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): Response {
  console.log(`[notFoundHandler] Ruta no encontrada: ${req.originalUrl}`);
  
  // Creamos el error con el código correcto
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404, ErrorCode.RESOURCE_NOT_FOUND);
  
  // Respondemos directamente con JSON en lugar de pasar al siguiente middleware
  return sendErrorResponse(res, error);
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