import { Router } from 'express';
import express from 'express';

import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { strictRateLimit, rateLimitMonitor } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { UserRole } from '../models/user.js';
import { loginSchema } from '../schemas/authSchemas.js';
import { createUserSchema } from '../schemas/user.schema.js';
import { authService } from '../services/auth.service.js';
import { AppError, ErrorCode } from '../utils/errors.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente.
 *       400:
 *         description: Error de validación en los datos de entrada.
 *       409:
 *         description: El email ya está registrado.
 *       429:
 *         description: Demasiados intentos de registro
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  '/register',
  rateLimitMonitor,
  strictRateLimit,
  validateBody(createUserSchema),
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión de usuario
 *     description: Autentica a un usuario y devuelve un token JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserOutput' # Definiremos UserOutput más adelante
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación.
 *                 expiresIn:
 *                   type: integer
 *                   description: Tiempo de expiración del token en segundos.
 *                   example: 3600
 *       400:
 *         description: Error de validación en los datos de entrada.
 *       401:
 *         description: Credenciales inválidas.
 *       429:
 *         description: Demasiados intentos de login
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  '/login',
  rateLimitMonitor,
  strictRateLimit,
  validateBody(loginSchema),
  authController.login
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Renovar token JWT
 *     description: Renueva un token JWT existente utilizando un token de portador.
 *     security:
 *       - bearerAuth: [] # Indica que requiere JWT
 *     responses:
 *       200:
 *         description: Token renovado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Nuevo token JWT.
 *                 expiresIn:
 *                   type: integer
 *                   example: 3600
 *       401:
 *         description: Token inválido, expirado o no proporcionado.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/refresh', authController.refreshToken);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Obtener información del usuario actual
 *     description: Devuelve los datos del usuario asociado al token JWT o API Key proporcionado.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario obtenidos correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserOutput'
 *       401:
 *         description: No autenticado (token o API key inválido/a o ausente).
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/me', authMiddleware.authenticateJwt, authController.me);

/**
 * @openapi
 * /api/auth/api-key:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Generar una nueva API key
 *     description: Genera una nueva API key para el usuario autenticado (vía JWT o API Key existente) y la invalida si ya existía una.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: API Key generada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 apiKey:
 *                   type: string
 *                   description: La nueva API Key generada (¡mostrar solo esta vez!).
 *       401:
 *         description: No autenticado.
 *       404:
 *         description: Usuario no encontrado (raro si está autenticado).
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/api-key', authMiddleware.authenticateJwt, authController.generateApiKey);

/**
 * @openapi
 * /api/auth/admin:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Acceso a endpoint protegido para rol Admin
 *     description: Endpoint de prueba que requiere rol de Administrador.
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Acceso concedido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Acceso de administrador concedido
 *                 user:
 *                   $ref: '#/components/schemas/UserOutput'
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (rol insuficiente).
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  '/admin',
  authMiddleware.authenticateJwt,
  authMiddleware.checkRole(UserRole.ADMIN),
  authController.adminAccess
);

/**
 * @openapi
 * /api/auth/premium:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Acceso a endpoint protegido para rol Premium o Admin
 *     description: Endpoint de prueba que requiere rol Premium o superior (Admin).
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Acceso concedido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Acceso premium concedido
 *                 user:
 *                   $ref: '#/components/schemas/UserOutput'
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (rol insuficiente).
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  '/premium',
  authMiddleware.authenticateJwt,
  authMiddleware.checkRole(UserRole.PREMIUM),
  authController.premiumAccess
);

/**
 * @openapi
 * components:
 *   schemas:
 *     UserOutput:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del usuario.
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, PREMIUM]
 *           description: Rol del usuario.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización.
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha del último inicio de sesión.
 *         apiKeyPrefix:
 *           type: string
 *           nullable: true
 *           description: Prefijo de la API Key (si existe).
 *         apiUsage:
 *           type: integer
 *           description: Contador de uso de API.
 *         isActive:
 *           type: boolean
 *           description: Indica si el usuario está activo.
 */
export const authRoutes = router;
