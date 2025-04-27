import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config.js';
import { userStore } from '../models/user.js';
import { AppError, ErrorCode } from '../utils/errors.js';

export class AuthMiddleware {
  /**
   * Middleware para validar autenticación en rutas protegidas
   * Verifica el token JWT y establece el usuario en el objeto de solicitud
   */
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Obtener token de authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No se proporcionó token de acceso', 401, ErrorCode.UNAUTHORIZED);
      }

      const token = authHeader.split(' ')[1];

      // Verificar token
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
        const userId = decoded.sub;

        if (!userId) {
          throw new AppError('Token inválido', 401, ErrorCode.UNAUTHORIZED);
        }

        // Buscar usuario por ID
        const user = await userStore.findById(userId as string);

        if (!user) {
          throw new AppError('Usuario no encontrado', 401, ErrorCode.UNAUTHORIZED);
        }

        // Establecer usuario en el request para las rutas siguientes
        req.user = user;
        next();
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          throw new AppError('Token inválido o expirado', 401, ErrorCode.UNAUTHORIZED);
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Middleware para verificar autenticación con API Key
   */
  async apiKeyStrategy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apiKey = req.headers['x-api-key'] as string;

      // Si no hay API Key, continuar con otros métodos de autenticación
      if (!apiKey) {
        return next();
      }

      // Extraer prefijo (primeros 8 caracteres) para búsqueda rápida
      if (apiKey.length < 8) {
        return next(); // Clave API incorrecta, pero continuamos con otros métodos
      }

      const apiKeyPrefix = apiKey.substring(0, 8);
      const user = await userStore.findByApiKeyPrefix(apiKeyPrefix);

      if (!user || !user.isActive) {
        return next(); // No encontrado o inactivo, continuar con otros métodos
      }

      // Verificar si la API Key completa coincide usando bcrypt.compare
      const isValidApiKey = await userStore.validateApiKey(user, apiKey);

      if (!isValidApiKey) {
        return next(); // Clave API inválida, continuar con otros métodos
      }

      // Actualizar contador de uso
      await userStore.incrementApiUsage(user.id);

      // Establecer usuario en el request
      req.user = user;
      return next();
    } catch (error) {
      // En caso de error, simplemente seguir con el siguiente middleware
      // sin establecer el usuario
      next();
    }
  }

  /**
   * Middleware para verificar roles de usuario
   * @param roles Lista de roles permitidos
   */
  checkRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new AppError('No autenticado', 401, ErrorCode.UNAUTHORIZED);
        }

        const userRole = req.user.role.toUpperCase();
        
        if (!roles.includes(userRole)) {
          throw new AppError(
            `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}`,
            403,
            ErrorCode.FORBIDDEN
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export const authMiddleware = new AuthMiddleware(); 