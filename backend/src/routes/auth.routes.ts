import { Router } from 'express';

import {
  authController,
  loginValidators,
  registerValidators,
} from '../controllers/auth.controller';
import { authenticateJwt, checkRole } from '../middleware/authMiddleware';
import { UserRole } from '../models/user';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario
 * @access  Público
 */
router.post('/register', registerValidators, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión y obtener token JWT
 * @access  Público
 */
router.post('/login', loginValidators, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token JWT
 * @access  Público (con token JWT válido)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Privado
 */
router.get('/me', authenticateJwt, authController.me);

/**
 * @route   POST /api/auth/api-key
 * @desc    Generar una nueva API key
 * @access  Privado
 */
router.post('/api-key', authenticateJwt, authController.generateApiKey);

/**
 * @route   POST /api/auth/admin
 * @desc    Punto de acceso exclusivo para administradores (prueba de roles)
 * @access  Privado (sólo admin)
 */
router.post('/admin', authenticateJwt, checkRole(UserRole.ADMIN), authController.adminAccess);

/**
 * @route   POST /api/auth/premium
 * @desc    Punto de acceso exclusivo para usuarios premium (prueba de roles)
 * @access  Privado (sólo premium o admin)
 */
router.post('/premium', authenticateJwt, checkRole(UserRole.PREMIUM), authController.premiumAccess);

export const authRoutes = router;
