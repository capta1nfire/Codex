import { Response } from 'express';

import logger from '../utils/logger.js';

// Códigos de error HTTP
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Códigos de error internos
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// Clase base para todos los errores de la aplicación
export class AppError extends Error {
  statusCode: number;
  code?: ErrorCode;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: ErrorCode, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Error para fallos de validación
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, context);
  }
}

// Error para recursos no encontrados
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, context);
  }
}

// Error para autenticación
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, context);
  }
}

// Error para autorización
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, context);
  }
}

// Error para servicios no disponibles
export class ServiceUnavailableError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE, context);
  }
}

// Error para limite de peticiones
export class RateLimitError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, ErrorCode.INTERNAL_SERVER, context);
  }
}

// Función para enviar respuestas de error estandarizadas
export function sendErrorResponse(res: Response, error: AppError | Error): Response {
  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`, {
      stack: error.stack,
      context: error.details,
    });

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        context: error.details,
      },
    });
  }

  // Para errores genéricos
  logger.error(`UNEXPECTED_ERROR: ${error.message}`, {
    stack: error.stack,
  });

  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER,
      message: 'Ha ocurrido un error inesperado',
    },
  });
}

// Función para convertir un error genérico en una respuesta de error estandarizada
export const formatError = (
  error: Error | AppError
): {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
} => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  // Error genérico (no AppError)
  return {
    success: false,
    error: {
      message: error.message || 'Error del servidor',
      code: ErrorCode.INTERNAL_SERVER,
    },
  };
};
