import crypto from 'crypto';

import { Request, Response, NextFunction } from 'express';

import { userStore, UserRole } from '../models/user.js';
import { authService } from '../services/auth.service.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

import type { User } from '../models/user.js';

// We use Express.Request augmented with user?: User for authenticated user

export const authController = {
  /**
   * Registrar un nuevo usuario
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Obtener los nuevos campos del body
      const { email, password, firstName, lastName, username } = req.body;
      let user;
      try {
        // Crear el usuario con los nuevos campos
        user = await userStore.createUser({
          email,
          password,
          firstName,
          lastName, // Pasamos lastName (puede ser undefined)
          username, // Pasamos username
          role: UserRole.USER,
        });
      } catch (error) {
        // Manejar error específico de username duplicado (o email duplicado)
        if (error instanceof AppError && error.code === ErrorCode.CONFLICT_ERROR) {
          // El error de userStore ya indica si es email o username
          return next(error);
        }
        // Re-lanzar otros errores de createUser
        throw error;
      }

      // Generar token JWT
      const token = authService.generateToken(user);

      // Responder con el usuario creado (sin contraseña)
      res.status(201).json({
        success: true,
        user: userStore.sanitizeUser(user),
        token,
        expiresIn: 3600, // 1 hora por defecto
      });
    } catch (error) {
      // Captura errores generales o re-lanzados
      next(error);
    }
  },

  /**
   * Iniciar sesión de usuario
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Intentar autenticar usuario
      const authResponse = await authService.login(email, password);

      if (!authResponse) {
        throw new AppError('Credenciales inválidas', 401, ErrorCode.UNAUTHORIZED);
      }

      // Responder con los datos del usuario y token
      res.json({
        success: true,
        ...authResponse,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Renovar token JWT
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"

      if (!token) {
        throw new AppError('Token no proporcionado', 401, ErrorCode.UNAUTHORIZED);
      }

      // Intentar refrescar el token
      const refreshResult = await authService.refreshToken(token);

      if (!refreshResult) {
        throw new AppError('Token inválido o expirado', 401, ErrorCode.UNAUTHORIZED);
      }

      // Responder con el nuevo token
      res.json({
        success: true,
        ...refreshResult,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtener información del usuario actual
   */
  async me(req: Request, res: Response) {
    // El usuario ya debe estar autenticado mediante middleware
    const user = req.user as User;
    res.json({ success: true, user });
  },

  /**
   * Generar una nueva API key
   */
  async generateApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      // El usuario debe estar autenticado
      const user = req.user as User;
      if (!user) {
        throw new AppError('No autenticado', 401, ErrorCode.UNAUTHORIZED);
      }

      // Generar una API key segura y aleatoria (ej: 64 caracteres hexadecimales)
      const apiKey = crypto.randomBytes(32).toString('hex');
      logger.info(`[AuthController] Nueva API Key generada para usuario ${user.id}`);

      // Extraer el prefijo de la API Key (ej: primeros 8 caracteres)
      const apiKeyPrefix = apiKey.substring(0, 8);

      // Actualizar usuario con la *NUEVA* API key y su prefijo
      const updated = await userStore.updateUser(user.id, {
        apiKey: apiKey, // Pasamos la key en texto plano al store para que la hashee
        apiKeyPrefix: apiKeyPrefix, // Pasamos el prefijo para almacenamiento
      });

      if (!updated) {
        throw new AppError('Usuario no encontrado', 404, ErrorCode.NOT_FOUND);
      }

      // Responder SOLO con la API key en texto plano (¡Mostrar solo esta vez!)
      res.json({ success: true, apiKey });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Endpoint de prueba para rol Admin
   */
  async adminAccess(req: Request, res: Response, next: NextFunction) {
    // Acceso ya verificado por authenticateJwt y checkRole(ADMIN)
    const user = req.user as User;
    res.json({ success: true, message: 'Acceso de administrador concedido', user });
    next();
  },

  /**
   * Endpoint de prueba para rol Premium (o Admin)
   */
  async premiumAccess(req: Request, res: Response, next: NextFunction) {
    // Acceso ya verificado por authenticateJwt y checkRole(PREMIUM)
    const user = req.user as User;
    res.json({ success: true, message: 'Acceso premium concedido', user });
    next();
  },
};
