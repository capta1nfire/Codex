import { Response } from 'express';
import logger from './logger';

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
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

// Clase base para todos los errores de la aplicación
export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly errorCode: ErrorCode;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error para fallos de validación
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      context
    );
  }
}

// Error para recursos no encontrados
export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
      context
    );
  }
}

// Error para autenticación
export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.UNAUTHORIZED,
      ErrorCode.AUTHENTICATION_ERROR,
      context
    );
  }
}

// Error para autorización
export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.FORBIDDEN,
      ErrorCode.AUTHORIZATION_ERROR,
      context
    );
  }
}

// Error para servicios no disponibles
export class ServiceUnavailableError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
      context
    );
  }
}

// Error para limite de peticiones
export class RateLimitError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMIT_ERROR,
      context
    );
  }
}

// Función para enviar respuestas de error estandarizadas
export function sendErrorResponse(
  res: Response,
  error: AppError | Error
): Response {
  if (error instanceof AppError) {
    logger.error(`${error.errorCode}: ${error.message}`, {
      stack: error.stack,
      context: error.context,
    });

    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        context: error.context,
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
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Ha ocurrido un error inesperado',
    },
  });
}

// Función para enviar respuestas exitosas estandarizadas
export function sendSuccessResponse(
  res: Response,
  data: any,
  statusCode: HttpStatus = HttpStatus.OK
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
} 