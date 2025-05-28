import express from 'express';
import multer from 'multer';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateParams } from '../middleware/validationMiddleware.js';
import { userStore } from '../models/user.js';
import { avatarParamsSchema } from '../schemas/avatar.schema.js';
import { avatarService, DEFAULT_AVATARS } from '../services/avatar.service.js';
import { AppError, ErrorCode } from '../utils/errors.js';

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage(); // Almacenar en memoria para procesar con sharp
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Comprobar el tipo de archivo
    if (
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Sólo se permiten JPG y PNG'));
    }
  },
});

/**
 * @openapi
 * /api/avatars/upload:
 *   post:
 *     tags: [Avatars]
 *     summary: Sube una imagen de avatar para el usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar subido correctamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/upload',
  authMiddleware.authenticateJwt,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
      }
      const userId = (req.user as any).id;

      if (!userId) {
        throw new AppError('ID de usuario no encontrado en la sesión', 401, ErrorCode.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new AppError('No se proporcionó ninguna imagen', 400, ErrorCode.BAD_REQUEST);
      }

      // Eliminar avatar anterior si existe
      const user = await userStore.findById(userId);
      if (user?.avatarUrl) {
        await avatarService.deleteAvatar(user.avatarUrl);
      }

      // Guardar nuevo avatar
      const avatarUrl = await avatarService.saveAvatar(req.file);

      // Actualizar usuario con la nueva URL de avatar
      const updatedUser = await userStore.updateUser(userId, {
        avatarUrl,
        avatarType: 'image',
      });

      if (!updatedUser) {
        throw new AppError('Error al actualizar usuario', 500, ErrorCode.INTERNAL_SERVER);
      }

      res.json({
        success: true,
        message: 'Avatar actualizado correctamente',
        user: userStore.sanitizeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/avatars/default/{type}:
 *   post:
 *     tags: [Avatars]
 *     summary: Establece un avatar predeterminado para el usuario actual
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de avatar predeterminado a usar
 *     responses:
 *       200:
 *         description: Avatar predeterminado establecido correctamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/default/:type',
  authMiddleware.authenticateJwt,
  validateParams(avatarParamsSchema),
  async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
      }
      const userId = (req.user as any).id;

      if (!userId) {
        throw new AppError('ID de usuario no encontrado en la sesión', 401, ErrorCode.UNAUTHORIZED);
      }

      const { type } = req.params;

      // Actualizar usuario con avatar predeterminado
      const updatedUser = await userStore.updateUser(userId, {
        avatarUrl: avatarService.getDefaultAvatarUrl(type),
        avatarType: type,
      });

      if (!updatedUser) {
        throw new AppError('Error al actualizar usuario', 500, ErrorCode.INTERNAL_SERVER);
      }

      res.json({
        success: true,
        message: 'Avatar predeterminado establecido correctamente',
        user: userStore.sanitizeUser(updatedUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/avatars/reset:
 *   post:
 *     tags: [Avatars]
 *     summary: Restablece el avatar del usuario a la inicial del nombre
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar restablecido correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.post('/reset', authMiddleware.authenticateJwt, async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
    }
    const userId = (req.user as any).id;

    if (!userId) {
      throw new AppError('ID de usuario no encontrado en la sesión', 401, ErrorCode.UNAUTHORIZED);
    }

    // Eliminar avatar personalizado anterior si existe
    const user = await userStore.findById(userId);
    if (user?.avatarUrl && user.avatarType === 'image') {
      await avatarService.deleteAvatar(user.avatarUrl);
    }

    // Actualizar usuario para usar inicial
    const updatedUser = await userStore.updateUser(userId, {
      avatarUrl: null,
      avatarType: 'initial',
    });

    if (!updatedUser) {
      throw new AppError('Error al actualizar usuario', 500, ErrorCode.INTERNAL_SERVER);
    }

    res.json({
      success: true,
      message: 'Avatar restablecido a inicial correctamente',
      user: userStore.sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/avatars/default-options:
 *   get:
 *     tags: [Avatars]
 *     summary: Obtiene la lista de avatares predeterminados disponibles
 *     responses:
 *       200:
 *         description: Lista de opciones de avatares predeterminados
 */
router.get('/default-options', (_req, res) => {
  res.json({
    success: true,
    avatarOptions: DEFAULT_AVATARS.map((type) => ({
      type,
      url: avatarService.getDefaultAvatarUrl(type),
    })),
  });
});

export const avatarRoutes = router;
