import crypto from 'crypto';

import { Request as ExpressRequest, Response, NextFunction } from 'express';
import type { User } from '../models/user.js';

import { userStore, UserRole } from '../models/user.js';
import { authService } from '../services/auth.service.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Custom request type with authenticated user (Prisma User)
type RequestWithUser = ExpressRequest & { user: User };

export const authController = {
  /**
   * Registrar un nuevo usuario
   */
  async register(req: ExpressRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      // Crear el usuario (por defecto con rol USER)
      const user = await userStore.createUser({
        email,
        password,
        name,
        role: UserRole.USER,
      });

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
      // Si es un error de usuario existente
      if (error instanceof Error && error.message.includes('ya existe')) {
        return next(new AppError('El email ya está registrado', 409, ErrorCode.VALIDATION_ERROR));
      }

      next(error);
    }
  },

  /**
   * Iniciar sesión de usuario
   */
  async login(req: ExpressRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Intentar autenticar usuario
      const authResponse = await authService.login(email, password);

      if (!authResponse) {
        throw new AppError('Credenciales inválidas', 401, ErrorCode.AUTHENTICATION_ERROR);
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
  async refreshToken(req: ExpressRequest, res: Response, next: NextFunction) {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.authorization || '';
      const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"

      if (!token) {
        throw new AppError('Token no proporcionado', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Intentar refrescar el token
      const refreshResult = await authService.refreshToken(token);

      if (!refreshResult) {
        throw new AppError('Token inválido o expirado', 401, ErrorCode.AUTHENTICATION_ERROR);
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
  async me(req: ExpressRequest, res: Response) {
    // El usuario ya debe estar autenticado mediante middleware
    res.json({
      success: true,
      user: req.user,
    });
  },

  /**
   * Generar una nueva API key
   */
  async generateApiKey(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      // El usuario debe estar autenticado
      if (!req.user) {
        throw new AppError('No autenticado', 401, ErrorCode.AUTHENTICATION_ERROR);
      }

      // Generar una API key segura y aleatoria (ej: 64 caracteres hexadecimales)
      const apiKey = crypto.randomBytes(32).toString('hex');
      logger.info(`[AuthController] Nueva API Key generada para usuario ${req.user.id}`);

      // Extraer el prefijo de la API Key (ej: primeros 8 caracteres)
      const apiKeyPrefix = apiKey.substring(0, 8);

      // Actualizar usuario con la *NUEVA* API key y su prefijo
      const user = await userStore.updateUser(req.user.id, {
        apiKey: apiKey, // Pasamos la key en texto plano al store para que la hashee
        apiKeyPrefix: apiKeyPrefix, // Pasamos el prefijo para almacenamiento
      });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404, ErrorCode.RESOURCE_NOT_FOUND);
      }

      // Responder SOLO con la API key en texto plano (¡Mostrar solo esta vez!)
      res.json({
        success: true,
        apiKey, // Devolver la key recién generada en texto plano
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Endpoint de prueba para rol Admin
   */
  async adminAccess(req: RequestWithUser, res: Response) {
    // Acceso ya verificado por authenticateJwt y checkRole(ADMIN)
    res.json({
      success: true,
      message: 'Acceso de administrador concedido',
      user: req.user, // req.user está disponible gracias a los middlewares
    });
  },

  /**
   * Endpoint de prueba para rol Premium (o Admin)
   */
  async premiumAccess(req: RequestWithUser, res: Response) {
    // Acceso ya verificado por authenticateJwt y checkRole(PREMIUM)
    res.json({
      success: true,
      message: 'Acceso premium concedido',
      user: req.user,
    });
  },
};
