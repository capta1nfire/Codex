import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

import { JwtPayload } from '../services/auth.service.js';
import {
  AppError,
  sendErrorResponse,
  NotFoundError,
  ErrorCode,
  formatError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Middleware para manejar rutas no encontradas
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404, ErrorCode.NOT_FOUND);
  next(error);
}

/**
 * Middleware para manejar errores
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Evitar que Express continue si ya se ha enviado la respuesta
  if (res.headersSent) {
    return next(error);
  }

  // Capturar error en Sentry para errores críticos
  if (!(error instanceof AppError) || error.statusCode >= 500) {
    Sentry.captureException(error, {
      tags: {
        path: req.path,
        method: req.method,
        statusCode: error instanceof AppError ? error.statusCode : 500,
      },
      user: req.user ? { id: (req.user as any).id } : undefined,
    });
  }

  if (error instanceof AppError) {
    // Log del error
    logger.error(`[${error.statusCode}] ${error.code}: ${error.message}`, {
      path: req.path,
      method: req.method,
      details: error.details,
    });

    // Enviar respuesta formateada
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  // Error desconocido
  logger.error('Error no manejado:', error);

  // Enviar respuesta de error genérica
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER,
      message: 'Error interno del servidor',
    },
  });
}

// Middleware para capturar excepciones asíncronas no manejadas
export function asyncErrorWrapper(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}
