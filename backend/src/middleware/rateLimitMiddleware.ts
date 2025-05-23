import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Rate limiting diferenciado por tipo de usuario y endpoint
 * Implementa la Opción B del reporte de Jules
 */

// Rate limiting básico para usuarios no autenticados
export const basicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.',
      suggestion: 'Considera crear una cuenta para obtener mayor límite de requests.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para API de generación (sin auth)
export const generationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: Request) => {
    // Límite dinámico basado en el tipo de código
    const barcodeType = req.body?.barcode_type;
    switch (barcodeType) {
      case 'qrcode':
        return 50; // QR codes: 50/hora
      case 'code128':
      case 'ean13':
        return 30; // Códigos de barras: 30/hora
      default:
        return 20; // Otros tipos: 20/hora
    }
  },
  keyGenerator: (req: Request) => {
    // Usar API key si está disponible, sino IP
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey ? `apikey:${apiKey}` : `ip:${req.ip}`;
  },
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Límite de generación de códigos alcanzado.',
      suggestion: 'Espera una hora o considera actualizar tu plan.',
    },
  },
});

// Rate limiting para usuarios autenticados
export const authenticatedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: (req: Request) => {
    const user = req.user as any;
    if (!user) return 100;
    
    // Límites diferenciados por rol
    switch (user.role) {
      case 'admin':
        return 1000; // Administradores: 1000/15min
      case 'premium':
        return 500;  // Premium: 500/15min
      case 'user':
        return 300;  // Usuarios regulares: 300/15min
      default:
        return 100;  // Por defecto: 100/15min
    }
  },
  keyGenerator: (req: Request) => {
    const user = req.user as any;
    return user ? `user:${user.id}` : `ip:${req.ip}`;
  },
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Límite de requests alcanzado para tu cuenta.',
      suggestion: 'Espera 15 minutos o considera actualizar tu plan.',
    },
  },
});

// Rate limiting estricto para operaciones sensibles (auth, uploads)
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // Máximo 20 intentos por hora
  keyGenerator: (req: Request) => `strict:${req.ip}`,
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Demasiados intentos desde esta IP.',
      suggestion: 'Espera una hora antes de intentar de nuevo.',
    },
  },
  skip: (req: Request) => {
    // Skip rate limiting para admins en desarrollo
    const user = req.user as any;
    return process.env.NODE_ENV === 'development' && user?.role === 'admin';
  },
});

// Rate limiting para API keys
export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: Request) => {
    // Límite basado en el plan del API key
    // TODO: Implementar lookup de plan en la base de datos
    return 1000; // Por ahora límite estándar
  },
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'] as string;
    return `apikey:${apiKey}`;
  },
  message: {
    success: false,
    error: {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Límite de API key alcanzado.',
      suggestion: 'Verifica tu plan o espera una hora.',
    },
  },
});

// Middleware de rate limiting inteligente
export const intelligentRateLimit = (req: Request, res: Response, next: any) => {
  // Determinar qué tipo de rate limiting aplicar
  const apiKey = req.headers['x-api-key'] as string;
  const user = req.user as any;
  
  if (apiKey) {
    // Usar rate limiting de API key
    return apiKeyRateLimit(req, res, next);
  } else if (user) {
    // Usar rate limiting autenticado
    return authenticatedRateLimit(req, res, next);
  } else {
    // Usar rate limiting básico
    return basicRateLimit(req, res, next);
  }
};

// Monitor de rate limiting (para métricas)
export const rateLimitMonitor = (req: Request, res: Response, next: any) => {
  const originalSend = res.json;
  
  res.json = function(data: any) {
    // Log cuando se alcanza el rate limit
    if (data?.error?.code === ErrorCode.RATE_LIMIT_EXCEEDED) {
      const user = req.user as any;
      logger.warn('Rate limit alcanzado', {
        ip: req.ip,
        userId: user?.id,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
    }
    return originalSend.call(this, data);
  };
  
  next();
}; 