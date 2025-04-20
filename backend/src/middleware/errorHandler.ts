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
  // Clonar y sanitizar el body para evitar loguear datos sensibles
  let sanitizedBody: any = {};
  if (req.body && typeof req.body === 'object') {
    sanitizedBody = { ...req.body };
    // Lista de campos a enmascarar/eliminar
    const sensitiveFields = ['password', 'confirmPassword', 'token', 'apiKey', 'secret', 'authorization']; // Añadir otros si es necesario
    for (const field of sensitiveFields) {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[FILTERED]'; // Reemplazar valor
      }
    }
    // Considerar truncar campos largos si es necesario
    // for (const key in sanitizedBody) {
    //   if (typeof sanitizedBody[key] === 'string' && sanitizedBody[key].length > 200) {
    //     sanitizedBody[key] = sanitizedBody[key].substring(0, 197) + '...';
    //   }
    // }
  } else if (req.body) {
    // Si el body no es un objeto, intentar loguear su tipo
    sanitizedBody = `[Non-object body: ${typeof req.body}]`;
  }

  // Registro de información de la solicitud para depuración (usando sanitizedBody)
  logger.error('Error en la solicitud', {
    error: error.message,
    stack: error.stack, // Considerar omitir stack en producción para logs más limpios
    path: req.path,
    method: req.method,
    body: sanitizedBody, // Usar el body sanitizado
    params: req.params,
    query: req.query,
    headers: {
      // Loguear solo headers seleccionados y no sensibles
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'origin': req.headers['origin'], // Útil para CORS
      'referer': req.headers['referer'], // Útil para rastrear origen
      // NUNCA loguear 'Authorization' o 'Cookie' completos
    },
    ip: req.ip,
    // Añadir ID de usuario si está disponible para correlación
    userId: req.user?.id 
  });

  return sendErrorResponse(res, error);
}

// Middleware para capturar excepciones asíncronas no manejadas
export function asyncErrorWrapper(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction): Promise<any> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
} 