import { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import { userStore, UserRole } from '../models/user';
import { authService } from '../services/auth.service';
import { AppError, ErrorCode } from '../utils/errors';
import logger from '../utils/logger';
import crypto from 'crypto';

// Validadores para registro de usuario
export const registerValidators = [
  check('email')
    .exists().withMessage('El email es obligatorio')
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),
  
  check('password')
    .exists().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[a-z]/).withMessage('La contraseña debe tener al menos una letra minúscula')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una letra mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número'),
  
  check('name')
    .exists().withMessage('El nombre es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres')
    .trim(),
];

// Validadores para login de usuario
export const loginValidators = [
  check('email')
    .exists().withMessage('El email es obligatorio')
    .isEmail().withMessage('Formato de email inválido')
    .normalizeEmail(),
  
  check('password')
    .exists().withMessage('La contraseña es obligatoria')
];

export const authController = {
  /**
   * Registrar un nuevo usuario
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Error de validación', 
          400, 
          ErrorCode.VALIDATION_ERROR, 
          errors.array()
        );
      }
      
      const { email, password, name } = req.body;
      
      // Crear el usuario (por defecto con rol USER)
      const user = await userStore.createUser({
        email,
        password,
        name,
        role: UserRole.USER
      });
      
      // Generar token JWT
      const token = authService.generateToken(user);
      
      // Responder con el usuario creado (sin contraseña)
      res.status(201).json({
        success: true,
        user: userStore.sanitizeUser(user),
        token,
        expiresIn: 3600 // 1 hora por defecto
      });
    } catch (error) {
      // Si es un error de usuario existente
      if (error instanceof Error && error.message.includes('ya existe')) {
        return next(new AppError(
          'El email ya está registrado', 
          409, 
          ErrorCode.VALIDATION_ERROR
        ));
      }
      
      next(error);
    }
  },
  
  /**
   * Iniciar sesión de usuario
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Error de validación', 
          400, 
          ErrorCode.VALIDATION_ERROR, 
          errors.array()
        );
      }
      
      const { email, password } = req.body;
      
      // Intentar autenticar usuario
      const authResponse = await authService.login(email, password);
      
      if (!authResponse) {
        throw new AppError(
          'Credenciales inválidas', 
          401, 
          ErrorCode.AUTHENTICATION_ERROR
        );
      }
      
      // Responder con los datos del usuario y token
      res.json({
        success: true,
        ...authResponse
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
        throw new AppError(
          'Token no proporcionado', 
          401, 
          ErrorCode.AUTHENTICATION_ERROR
        );
      }
      
      // Intentar refrescar el token
      const refreshResult = await authService.refreshToken(token);
      
      if (!refreshResult) {
        throw new AppError(
          'Token inválido o expirado', 
          401, 
          ErrorCode.AUTHENTICATION_ERROR
        );
      }
      
      // Responder con el nuevo token
      res.json({
        success: true,
        ...refreshResult
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
    res.json({
      success: true,
      user: req.user
    });
  },
  
  /**
   * Generar una nueva API key
   */
  async generateApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      // El usuario debe estar autenticado
      if (!req.user) {
        throw new AppError(
          'No autenticado', 
          401, 
          ErrorCode.AUTHENTICATION_ERROR
        );
      }
      
      // Generar una API key segura y aleatoria (ej: 64 caracteres hexadecimales)
      const apiKey = crypto.randomBytes(32).toString('hex');
      logger.info(`[AuthController] Nueva API Key generada para usuario ${req.user.id}`);
      
      // Actualizar usuario con la *NUEVA* API key (¡IMPORTANTE: UserStore la hasheará!)
      const user = await userStore.updateUser(req.user.id, { 
        apiKey: apiKey, // Pasamos la key en texto plano al store para que la hashee
        updatedAt: new Date()
      });
      
      if (!user) {
        throw new AppError(
          'Usuario no encontrado', 
          404, 
          ErrorCode.RESOURCE_NOT_FOUND
        );
      }
      
      // Responder SOLO con la API key en texto plano (¡Mostrar solo esta vez!)
      res.json({
        success: true,
        apiKey // Devolver la key recién generada en texto plano
      });
    } catch (error) {
      next(error);
    }
  }
}; 