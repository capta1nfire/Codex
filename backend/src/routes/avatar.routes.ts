import express from 'express';
import multer from 'multer';
import { avatarService, DEFAULT_AVATARS } from '../services/avatar.service.js';
import { userStore } from '../models/user.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
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
  authMiddleware.authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new AppError('No se proporcionó ninguna imagen', 400, ErrorCode.BAD_REQUEST);
      }

      // Eliminar avatar anterior si existe
      const user = await userStore.findById(req.user.id);
      if (user?.avatarUrl) {
        await avatarService.deleteAvatar(user.avatarUrl);
      }

      // Guardar nuevo avatar
      const avatarUrl = await avatarService.saveAvatar(req.file);

      // Actualizar usuario con la nueva URL de avatar
      await userStore.updateUser(req.user.id, {
        avatarUrl,
        avatarType: 'image',
      });

      // Obtener usuario actualizado para respuesta
      const updatedUser = await userStore.findById(req.user.id);

      res.json({
        success: true,
        message: 'Avatar actualizado correctamente',
        user: updatedUser,
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
  authMiddleware.authenticate,
  async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
      }

      const { type } = req.params;
      
      // Validar tipo de avatar
      if (!DEFAULT_AVATARS.includes(type)) {
        throw new AppError(
          `Tipo de avatar no válido. Opciones disponibles: ${DEFAULT_AVATARS.join(', ')}`,
          400,
          ErrorCode.BAD_REQUEST
        );
      }

      // Eliminar avatar personalizado anterior si existe
      const user = await userStore.findById(req.user.id);
      if (user?.avatarUrl && user.avatarType === 'image') {
        await avatarService.deleteAvatar(user.avatarUrl);
      }

      // Actualizar usuario con avatar predeterminado
      await userStore.updateUser(req.user.id, {
        avatarUrl: avatarService.getDefaultAvatarUrl(type),
        avatarType: type,
      });

      // Obtener usuario actualizado para respuesta
      const updatedUser = await userStore.findById(req.user.id);

      res.json({
        success: true,
        message: 'Avatar predeterminado establecido correctamente',
        user: updatedUser,
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
router.post('/reset', authMiddleware.authenticate, async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('Usuario no autenticado', 401, ErrorCode.UNAUTHORIZED);
    }

    // Eliminar avatar personalizado anterior si existe
    const user = await userStore.findById(req.user.id);
    if (user?.avatarUrl && user.avatarType === 'image') {
      await avatarService.deleteAvatar(user.avatarUrl);
    }

    // Actualizar usuario para usar inicial
    await userStore.updateUser(req.user.id, {
      avatarUrl: null,
      avatarType: 'initial',
    });

    // Obtener usuario actualizado para respuesta
    const updatedUser = await userStore.findById(req.user.id);

    res.json({
      success: true,
      message: 'Avatar restablecido a inicial correctamente',
      user: updatedUser,
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
router.get('/default-options', (req, res) => {
  res.json({
    success: true,
    avatarOptions: DEFAULT_AVATARS.map((type) => ({
      type,
      url: avatarService.getDefaultAvatarUrl(type),
    })),
  });
});

export const avatarRoutes = router; 