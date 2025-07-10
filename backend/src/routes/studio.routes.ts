/**
 * Studio Routes
 *
 * Rutas para la API de QR Studio. Solo accesible para SUPERADMIN.
 * Gestiona configuraciones de QR globales, plantillas y placeholders.
 */

import { StudioConfigType } from '@prisma/client';
import express from 'express';
import { z } from 'zod';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { studioService } from '../services/studioService.js';
import { AppError, ErrorCode, HttpStatus } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Schema de validación para configuración QR
const qrConfigSchema = z.object({
  eye_shape: z
    .enum([
      'square',
      'rounded_square',
      'circle',
      'dot',
      'leaf',
      'star',
      'diamond',
      'cross',
      'hexagon',
      'heart',
      'shield',
      'crystal',
      'flower',
      'arrow',
    ])
    .optional(),
  data_pattern: z
    .enum(['square', 'dots', 'rounded', 'circular', 'star', 'cross', 'wave', 'mosaic'])
    .optional(),
  colors: z
    .object({
      foreground: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      background: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      eye_colors: z
        .object({
          outer: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          inner: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
        })
        .optional(),
    })
    .optional(),
  gradient: z
    .object({
      enabled: z.boolean(),
      gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']).optional(),
      colors: z
        .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
        .min(2)
        .max(5)
        .optional(),
      angle: z.number().min(0).max(360).optional(),
      apply_to_eyes: z.boolean().optional(),
      apply_to_data: z.boolean().optional(),
      stroke_style: z
        .object({
          enabled: z.boolean(),
          color: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          width: z.number().min(0.1).max(2.0).optional(),
          opacity: z.number().min(0.1).max(1.0).optional(),
        })
        .optional(),
    })
    .optional(),
  effects: z
    .array(
      z.object({
        type: z.enum(['shadow', 'glow', 'blur', 'noise', 'vintage']),
        intensity: z.number().min(0).max(100).optional(),
      })
    )
    .optional(),
  error_correction: z.enum(['L', 'M', 'Q', 'H']).optional(),
  logo: z
    .object({
      enabled: z.boolean(),
      size_percentage: z.number().min(10).max(30).optional(),
      padding: z.number().min(0).max(20).optional(),
      shape: z.enum(['square', 'circle', 'rounded_square']).optional(),
    })
    .optional(),
  frame: z
    .object({
      enabled: z.boolean(),
      style: z.enum(['simple', 'rounded', 'bubble', 'speech', 'badge']).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    })
    .optional(),
});

// Schema para crear/actualizar configuración
const upsertConfigSchema = z.object({
  type: z.nativeEnum(StudioConfigType),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  templateType: z.string().optional(),
  config: qrConfigSchema,
});

// Middleware para verificar SUPERADMIN
const requireSuperAdmin = [
  authMiddleware.authenticateJwt,
  authMiddleware.checkRole(['SUPERADMIN']),
];

/**
 * GET /api/studio/configs
 * Obtener todas las configuraciones activas
 */
router.get('/configs', requireSuperAdmin, async (req, res, next) => {
  try {
    const configs = await studioService.getAllConfigs(req.user!.id);
    res.json({ configs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/studio/configs/:type/:templateType?
 * Obtener configuración específica por tipo
 */
router.get('/configs/:type/:templateType?', requireSuperAdmin, async (req, res, next) => {
  try {
    const { type, templateType } = req.params;

    // Validar tipo
    if (!Object.values(StudioConfigType).includes(type as StudioConfigType)) {
      throw new AppError(
        'Tipo de configuración inválido',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const config = await studioService.getConfigByType(type as StudioConfigType, templateType);

    if (!config) {
      throw new AppError('Configuración no encontrada', HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
    }

    res.json({ config });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/studio/configs
 * Crear o actualizar configuración
 */
router.post('/configs', requireSuperAdmin, async (req, res, next) => {
  try {
    // Validar body
    const validatedData = upsertConfigSchema.parse(req.body);

    // Validaciones adicionales
    if (validatedData.type === StudioConfigType.TEMPLATE && !validatedData.templateType) {
      throw new AppError(
        'templateType es requerido para configuraciones de tipo TEMPLATE',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (validatedData.type !== StudioConfigType.TEMPLATE && validatedData.templateType) {
      throw new AppError(
        'templateType solo es válido para configuraciones de tipo TEMPLATE',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const config = await studioService.upsertConfig(req.user!.id, validatedData);

    logger.info(`Configuración ${config.id} creada/actualizada por ${req.user!.email}`);
    res.json({
      config,
      message: 'Configuración guardada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(
        new AppError(
          'Datos de configuración inválidos',
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
          error.errors
        )
      );
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/studio/configs/:id
 * Eliminar (desactivar) configuración
 */
router.delete('/configs/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    await studioService.deleteConfig(id, req.user!.id);

    logger.info(`Configuración ${id} eliminada por ${req.user!.email}`);
    res.json({
      message: 'Configuración eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/studio/configs/reset
 * Resetear todas las configuraciones a valores por defecto
 */
router.post('/configs/reset', requireSuperAdmin, async (req, res, next) => {
  try {
    await studioService.resetToDefaults(req.user!.id);

    logger.info(`Configuraciones reseteadas por ${req.user!.email}`);
    res.json({
      message: 'Configuraciones reseteadas a valores por defecto',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/studio/configs/apply-all
 * Aplicar configuración a todas las plantillas
 */
router.post('/configs/apply-all', requireSuperAdmin, async (req, res, next) => {
  try {
    const { config } = req.body;

    // Validar configuración
    const validatedConfig = qrConfigSchema.parse(config);

    await studioService.applyToAllTemplates(req.user!.id, validatedConfig);

    logger.info(`Configuración aplicada a todas las plantillas por ${req.user!.email}`);
    res.json({
      message: 'Configuración aplicada a todas las plantillas exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(
        new AppError(
          'Configuración inválida',
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
          error.errors
        )
      );
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/studio/effective-config/:templateType?
 * Obtener configuración efectiva (merge de global + template)
 */
router.get('/effective-config/:templateType?', requireSuperAdmin, async (req, res, next) => {
  try {
    const { templateType } = req.params;

    const effectiveConfig = await studioService.getEffectiveConfig(templateType);

    res.json({
      config: effectiveConfig,
      templateType: templateType || 'default',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
