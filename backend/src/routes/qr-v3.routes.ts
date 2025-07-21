/**
 * QR v3 Routes - Structured data for QR v3 implementation
 *
 * This module provides access to the v3 QR generation API that returns
 * structured data instead of SVG strings, enabling secure frontend rendering
 * without dangerouslySetInnerHTML.
 */

import axios from 'axios';
import express from 'express';
import passport from 'passport';
import { z } from 'zod';

import { authenticateJwt } from '../middleware/authMiddleware.js';
import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';
// import { incrementUsage } from '../services/usageService.js'; // TODO: Implement usage service
import { scannabilityService } from '../services/scannabilityService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Transform form-style options to customization format for Rust
 */
function transformFormOptionsToCustomization(options: any): any {
  // If already has customization, return as-is
  if (options.customization) {
    return options;
  }

  const customization: any = {};

  // Transform gradient options
  if (options.gradient_enabled) {
    customization.gradient = {
      enabled: true,
      gradient_type: options.gradient_type || 'linear',
      colors: [
        options.gradient_color1 || '#000000',
        options.gradient_color2 || '#666666'
      ],
      angle: options.gradient_angle,
      apply_to_data: options.gradient_apply_to_data !== false,
      apply_to_eyes: options.gradient_apply_to_eyes || false,
      per_module: options.gradient_per_module || false,
      ...(options.gradient_borders && {
        stroke_style: {
          enabled: true,
          width: options.gradient_stroke_width || 1,
          blend_mode: options.gradient_stroke_blend_mode || 'normal'
        }
      })
    };
  }

  // Transform eye styles
  if (options.use_separated_eye_styles) {
    customization.eye_border_style = options.eye_border_style;
    customization.eye_center_style = options.eye_center_style;
  } else if (options.eye_shape) {
    customization.eye_shape = options.eye_shape;
  }

  // Transform data pattern
  if (options.data_pattern) {
    customization.data_pattern = options.data_pattern;
  }

  // Transform colors
  if (options.fgcolor || options.bgcolor || options.eye_colors) {
    customization.colors = {
      ...(options.fgcolor && { foreground: options.fgcolor }),
      ...(options.bgcolor && { background: options.bgcolor }),
      ...(options.eye_colors && { eye_colors: options.eye_colors })
    };
  }

  // Transform logo - support both logo_image and logo_data fields
  if (options.logo_image || options.logo_data) {
    customization.logo = {
      data: options.logo_image || options.logo_data,
      size_percentage: options.logo_size || 20,
      padding: options.logo_padding || 0,
      background: options.logo_background,
      shape: options.logo_shape || 'square'
    };
  }

  return {
    error_correction: options.error_correction || options.ecl || 'M',
    ...(Object.keys(customization).length > 0 && { customization })
  };
}

// Middleware de autenticación opcional - intenta autenticar pero no falla
const optionalAuth = (req: any, res: any, next: any) => {
  // Si hay un token de autorización, intentar autenticar
  if (req.headers.authorization) {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (user) {
        req.user = user;
        logger.info('[QR V3] User authenticated via optional auth', {
          userId: user.id,
          userRole: user.role,
        });
      }
      next();
    })(req, res, next);
  } else {
    next();
  }
};

// Schema de validación mejorado para v3
const customizationSchema = z
  .object({
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
        eyes: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
      })
      .optional(),
    // Legacy eye_colors for backward compatibility
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

    // New enhanced eye color system - for eye centers
    eye_color_mode: z.enum(['inherit', 'solid', 'gradient']).optional(),
    eye_color_solid: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    eye_color_gradient: z
      .object({
        type: z.enum(['linear', 'radial']).optional(),
        color1: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        color2: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        direction: z.enum(['top-bottom', 'left-right', 'diagonal', 'center-out']).optional(),
      })
      .optional(),

    // Eye border/frame color system
    eye_border_color_mode: z.enum(['inherit', 'solid', 'gradient']).optional(),
    eye_border_color_solid: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    eye_border_color_gradient: z
      .object({
        type: z.enum(['linear', 'radial']).optional(),
        color1: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        color2: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        direction: z.enum(['top-bottom', 'left-right', 'diagonal', 'center-out']).optional(),
      })
      .optional(),
    // Separate gradient definitions for eye borders and centers
    eye_border_gradient: z
      .object({
        enabled: z.boolean(),
        gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']).optional(),
        colors: z
          .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
          .min(2)
          .max(5)
          .optional(),
        angle: z.number().min(0).max(360).optional(), // ✅ Added missing angle field for eye borders
      })
      .optional(),
    eye_center_gradient: z
      .object({
        enabled: z.boolean(),
        gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']).optional(),
        colors: z
          .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
          .min(2)
          .max(5)
          .optional(),
        angle: z.number().min(0).max(360).optional(), // ✅ Added missing angle field for eye centers
      })
      .optional(),
    eye_shape: z
      .enum([
        'square',
        'rounded_square',
        'circle',
        'dot',
        'star',
        'leaf',
        'bars_horizontal',
        'bars_vertical',
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
    eye_border_style: z
      .enum([
        'square',
        'rounded_square',
        'circle',
        'quarter_round',
        'cut_corner',
        'thick_border',
        'double_border',
        'diamond',
        'hexagon',
        'cross',
        'star',
        'leaf',
        'arrow',
        'teardrop',
        'wave',
        'petal',
        'crystal',
        'flame',
        'organic',
        'propuesta01',
      ])
      .optional(),
    eye_center_style: z
      .enum([
        'square',
        'rounded_square',
        'circle',
        'squircle',
        'dot',
        'star',
        'diamond',
        'cross',
        'plus',
      ])
      .optional(),
    data_pattern: z
      .enum([
        'square',
        'square_small',
        'dots',
        'rounded',
        'squircle',
        'vertical',
        'horizontal',
        'diamond',
        'circular',
        'star',
        'cross',
        'random',
        'wave',
        'mosaic',
      ])
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
        angle: z.number().min(0).max(360).optional(), // ✅ Added missing angle field
        apply_to_eyes: z.boolean().optional(),
        apply_to_data: z.boolean().optional(),
        per_module: z.boolean().optional(),
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
          type: z.enum([
            'shadow',
            'glow',
            'blur',
            'noise',
            'vintage',
            'distort',
            'emboss',
            'outline',
            'drop_shadow',
            'inner_shadow',
          ]),
          intensity: z.number().min(0).max(100).optional(),
          color: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          // Configuraciones específicas para nuevos efectos
          strength: z.number().min(0).max(100).optional(),
          frequency: z.number().min(0).max(10).optional(),
          direction: z.string().optional(),
          width: z.number().min(0).max(10).optional(),
          offset_x: z.number().min(-10).max(10).optional(),
          offset_y: z.number().min(-10).max(10).optional(),
          blur_radius: z.number().min(0).max(20).optional(),
          spread_radius: z.number().min(0).max(10).optional(),
          opacity: z.number().min(0).max(1).optional(),
        })
      )
      .max(5)
      .optional(),
    // Nuevo sistema de efectos selectivos (Fase 2.2)
    selective_effects: z
      .object({
        eyes: z
          .object({
            effects: z
              .array(
                z.object({
                  type: z.enum([
                    'shadow',
                    'glow',
                    'blur',
                    'noise',
                    'vintage',
                    'distort',
                    'emboss',
                    'outline',
                    'drop_shadow',
                    'inner_shadow',
                  ]),
                  intensity: z.number().min(0).max(100).optional(),
                  color: z
                    .string()
                    .regex(/^#[0-9A-Fa-f]{6}$/)
                    .optional(),
                  strength: z.number().min(0).max(100).optional(),
                  frequency: z.number().min(0).max(10).optional(),
                  direction: z.string().optional(),
                  width: z.number().min(0).max(10).optional(),
                  offset_x: z.number().min(-10).max(10).optional(),
                  offset_y: z.number().min(-10).max(10).optional(),
                  blur_radius: z.number().min(0).max(20).optional(),
                  spread_radius: z.number().min(0).max(10).optional(),
                  opacity: z.number().min(0).max(1).optional(),
                })
              )
              .max(3),
            blend_mode: z
              .enum([
                'normal',
                'multiply',
                'screen',
                'overlay',
                'soft_light',
                'hard_light',
                'color_dodge',
                'color_burn',
                'darken',
                'lighten',
                'difference',
                'exclusion',
              ])
              .optional(),
            render_priority: z.number().min(0).max(10).optional(),
            apply_to_fill: z.boolean().optional(),
            apply_to_stroke: z.boolean().optional(),
          })
          .optional(),
        data: z
          .object({
            effects: z
              .array(
                z.object({
                  type: z.enum([
                    'shadow',
                    'glow',
                    'blur',
                    'noise',
                    'vintage',
                    'distort',
                    'emboss',
                    'outline',
                    'drop_shadow',
                    'inner_shadow',
                  ]),
                  intensity: z.number().min(0).max(100).optional(),
                  color: z
                    .string()
                    .regex(/^#[0-9A-Fa-f]{6}$/)
                    .optional(),
                  strength: z.number().min(0).max(100).optional(),
                  frequency: z.number().min(0).max(10).optional(),
                  direction: z.string().optional(),
                  width: z.number().min(0).max(10).optional(),
                  offset_x: z.number().min(-10).max(10).optional(),
                  offset_y: z.number().min(-10).max(10).optional(),
                  blur_radius: z.number().min(0).max(20).optional(),
                  spread_radius: z.number().min(0).max(10).optional(),
                  opacity: z.number().min(0).max(1).optional(),
                })
              )
              .max(3),
            blend_mode: z
              .enum([
                'normal',
                'multiply',
                'screen',
                'overlay',
                'soft_light',
                'hard_light',
                'color_dodge',
                'color_burn',
                'darken',
                'lighten',
                'difference',
                'exclusion',
              ])
              .optional(),
            render_priority: z.number().min(0).max(10).optional(),
            apply_to_fill: z.boolean().optional(),
            apply_to_stroke: z.boolean().optional(),
          })
          .optional(),
        frame: z
          .object({
            effects: z
              .array(
                z.object({
                  type: z.enum([
                    'shadow',
                    'glow',
                    'blur',
                    'noise',
                    'vintage',
                    'distort',
                    'emboss',
                    'outline',
                    'drop_shadow',
                    'inner_shadow',
                  ]),
                  intensity: z.number().min(0).max(100).optional(),
                  color: z
                    .string()
                    .regex(/^#[0-9A-Fa-f]{6}$/)
                    .optional(),
                  strength: z.number().min(0).max(100).optional(),
                  frequency: z.number().min(0).max(10).optional(),
                  direction: z.string().optional(),
                  width: z.number().min(0).max(10).optional(),
                  offset_x: z.number().min(-10).max(10).optional(),
                  offset_y: z.number().min(-10).max(10).optional(),
                  blur_radius: z.number().min(0).max(20).optional(),
                  spread_radius: z.number().min(0).max(10).optional(),
                  opacity: z.number().min(0).max(1).optional(),
                })
              )
              .max(3),
            blend_mode: z
              .enum([
                'normal',
                'multiply',
                'screen',
                'overlay',
                'soft_light',
                'hard_light',
                'color_dodge',
                'color_burn',
                'darken',
                'lighten',
                'difference',
                'exclusion',
              ])
              .optional(),
            render_priority: z.number().min(0).max(10).optional(),
            apply_to_fill: z.boolean().optional(),
            apply_to_stroke: z.boolean().optional(),
          })
          .optional(),
        global: z
          .object({
            effects: z
              .array(
                z.object({
                  type: z.enum([
                    'shadow',
                    'glow',
                    'blur',
                    'noise',
                    'vintage',
                    'distort',
                    'emboss',
                    'outline',
                    'drop_shadow',
                    'inner_shadow',
                  ]),
                  intensity: z.number().min(0).max(100).optional(),
                  color: z
                    .string()
                    .regex(/^#[0-9A-Fa-f]{6}$/)
                    .optional(),
                  strength: z.number().min(0).max(100).optional(),
                  frequency: z.number().min(0).max(10).optional(),
                  direction: z.string().optional(),
                  width: z.number().min(0).max(10).optional(),
                  offset_x: z.number().min(-10).max(10).optional(),
                  offset_y: z.number().min(-10).max(10).optional(),
                  blur_radius: z.number().min(0).max(20).optional(),
                  spread_radius: z.number().min(0).max(10).optional(),
                  opacity: z.number().min(0).max(1).optional(),
                })
              )
              .max(3),
            blend_mode: z
              .enum([
                'normal',
                'multiply',
                'screen',
                'overlay',
                'soft_light',
                'hard_light',
                'color_dodge',
                'color_burn',
                'darken',
                'lighten',
                'difference',
                'exclusion',
              ])
              .optional(),
            render_priority: z.number().min(0).max(10).optional(),
            apply_to_fill: z.boolean().optional(),
            apply_to_stroke: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
    logo: z
      .object({
        data: z.string().min(1), // Base64 image data
        size_percentage: z.number().min(5).max(30).optional(),
        padding: z.number().min(0).max(20).optional(),
        shape: z.enum(['square', 'circle', 'rounded_square']).optional(),
      })
      .optional(),
    logo_size_ratio: z.number().min(0.05).max(0.3).optional(),
    frame: z
      .object({
        frame_type: z.enum(['simple', 'rounded', 'decorated', 'bubble', 'speech', 'badge']),
        text: z.string().min(1).max(50).optional(),
        text_size: z.number().min(10).max(20).optional(),
        text_font: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        background_color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        text_position: z.enum(['top', 'bottom', 'left', 'right']),
        padding: z.number().min(5).max(20).optional(),
        border_width: z.number().min(1).max(5).optional(),
        corner_radius: z.number().min(0).max(20).optional(),
      })
      .optional(),
  })
  .optional();

const qrV3RequestSchema = z.object({
  data: z.string().min(1).max(2953), // QR v40 max capacity
  options: z
    .object({
      error_correction: z.enum(['L', 'M', 'Q', 'H']).optional(),
      customization: customizationSchema,
    })
    .optional(),
});

// Tipo para la respuesta v3
interface QrV3Response {
  success: boolean;
  data?: {
    path_data: string;
    total_modules: number;
    data_modules: number;
    version: number;
    error_correction: string;
    metadata: {
      generation_time_ms: number;
      quiet_zone: number;
      content_hash: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
  };
}

/**
 * POST /api/v3/qr/generate
 * Generate QR code with structured data output
 */
router.post(
  '/generate',
  // authenticateJwt, // REMOVED: v3 is now free for all users
  generationRateLimit,
  async (req, res) => {
    const startTime = Date.now();

    try {
      // Validar entrada
      const validation = qrV3RequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        });
      }

      const { data, options } = validation.data;

      // Log de la solicitud
      logger.info('QR v3 generation request', {
        userId: req.user?.id,
        dataLength: data.length,
        options,
      });

      // URL del generador Rust
      const rustGeneratorUrl = process.env.RUST_GENERATOR_URL || 'http://localhost:3002';

      // Transform form-style options to customization format
      const transformedOptions = transformFormOptionsToCustomization(options || {});
      
      logger.info('Transformed options for v3:', {
        original: options,
        transformed: transformedOptions,
      });

      // Llamar al generador Rust v3
      const response = await axios.post(
        `${rustGeneratorUrl}/api/v3/qr/enhanced`,
        {
          data,
          options: transformedOptions,
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const rustResponse = response.data as QrV3Response;

      // Si la generación fue exitosa, incrementar uso
      if (rustResponse.success && req.user) {
        try {
          // await incrementUsage(req.user.id, 'qrcode'); // TODO: Implement usage tracking
        } catch (usageError) {
          logger.error('Failed to increment usage', {
            userId: req.user.id,
            error: usageError,
          });
          // No fallar la solicitud por esto
        }
      }

      // Calcular scannability score
      let scannabilityAnalysis = null;
      if (rustResponse.success && options?.customization) {
        try {
          scannabilityAnalysis = scannabilityService.calculateScore(options.customization);
          logger.info('Scannability score calculated', {
            score: scannabilityAnalysis.score,
            issueCount: scannabilityAnalysis.issues.length,
          });
        } catch (scoreError) {
          logger.error('Failed to calculate scannability score', {
            error: scoreError,
          });
          // No fallar la solicitud por esto
        }
      }

      // Agregar tiempo total de procesamiento
      const totalTime = Date.now() - startTime;

      // Responder con los datos estructurados
      res.json({
        ...rustResponse,
        metadata: {
          ...rustResponse.metadata,
          total_processing_time_ms: totalTime,
          backend_version: '1.0.0',
        },
        // Incluir análisis de escaneabilidad si está disponible
        ...(scannabilityAnalysis && { scannability: scannabilityAnalysis }),
      });
    } catch (error: any) {
      logger.error('QR v3 generation error', {
        error: error.message,
        stack: error.stack,
      });

      // Manejar errores de red
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'QR generation service is temporarily unavailable',
          },
        });
      }

      // Error genérico
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
);

/**
 * POST /api/v3/qr/enhanced
 * Generate QR code with enhanced structured data output (gradients, effects, etc.)
 */
router.post('/enhanced', optionalAuth, generationRateLimit, async (req, res) => {
  const startTime = Date.now();

  // Debug logging for rate limit investigation
  logger.info('[QR V3 Enhanced] Request received', {
    user: req.user,
    userId: req.user?.id,
    userRole: req.user?.role,
    headers: req.headers,
    ip: req.ip,
  });

  // Additional debugging for validation errors
  logger.info('[QR V3 Enhanced] Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Validar entrada con esquema más complejo
    const validation = qrV3RequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.errors,
        },
      });
    }

    const { data, options } = validation.data;

    // Log de la solicitud
    logger.info('QR v3 Enhanced generation request', {
      userId: req.user?.id,
      dataLength: data.length,
      hasGradient: !!options?.customization?.gradient,
      hasEffects: !!options?.customization?.effects,
      hasSelectiveEffects: !!options?.customization?.selective_effects,
      selectiveEffectsComponents: options?.customization?.selective_effects
        ? Object.keys(options.customization.selective_effects).filter(
            (key) => options.customization.selective_effects[key] != null
          )
        : [],
      options,
    });

    // URL del generador Rust
    const rustGeneratorUrl = process.env.RUST_GENERATOR_URL || 'http://localhost:3002';

    // Transform options from camelCase to snake_case for Rust
    const transformedOptions = options
      ? {
          error_correction: options.error_correction || options.errorCorrection || 'M',
          customization: options.customization
            ? {
                colors: options.customization.colors
                  ? {
                      ...options.customization.colors,
                      eye_colors: options.customization.eye_colors,
                    }
                  : options.customization.eye_colors
                    ? {
                        foreground: '#000000',
                        background: '#FFFFFF',
                        eye_colors: options.customization.eye_colors,
                      }
                    : undefined,
                // New enhanced eye color fields
                eye_color_mode: options.customization.eye_color_mode,
                eye_color_solid: options.customization.eye_color_solid,
                eye_color_gradient: options.customization.eye_color_gradient,
                eye_border_color_mode: options.customization.eye_border_color_mode,
                eye_border_color_solid: options.customization.eye_border_color_solid,
                eye_border_color_gradient: options.customization.eye_border_color_gradient,
                // Forward the new gradient fields for eyes
                eye_border_gradient: options.customization.eye_border_gradient,
                eye_center_gradient: options.customization.eye_center_gradient,
                gradient: options.customization.gradient,
                eye_shape: options.customization.eye_shape || options.customization.eyeShape,
                eye_border_style:
                  options.customization.eye_border_style || options.customization.eyeBorderStyle,
                eye_center_style:
                  options.customization.eye_center_style || options.customization.eyeCenterStyle,
                data_pattern:
                  options.customization.data_pattern || options.customization.dataPattern,
                effects: options.customization.effects,
                selective_effects: options.customization.selective_effects
                  ? {
                      ...(options.customization.selective_effects.eyes && {
                        eyes: {
                          ...options.customization.selective_effects.eyes,
                          effects: options.customization.selective_effects.eyes.effects?.map(
                            (effect) => {
                              const { type, ...otherProps } = effect;
                              return {
                                ...otherProps,
                                effect_type: type || effect.effect_type,
                              };
                            }
                          ),
                        },
                      }),
                      ...(options.customization.selective_effects.data && {
                        data: {
                          ...options.customization.selective_effects.data,
                          effects: options.customization.selective_effects.data.effects?.map(
                            (effect) => {
                              const { type, ...otherProps } = effect;
                              return {
                                ...otherProps,
                                effect_type: type || effect.effect_type,
                              };
                            }
                          ),
                        },
                      }),
                      ...(options.customization.selective_effects.frame && {
                        frame: {
                          ...options.customization.selective_effects.frame,
                          effects: options.customization.selective_effects.frame.effects?.map(
                            (effect) => {
                              const { type, ...otherProps } = effect;
                              return {
                                ...otherProps,
                                effect_type: type || effect.effect_type,
                              };
                            }
                          ),
                        },
                      }),
                      ...(options.customization.selective_effects.global && {
                        global: {
                          ...options.customization.selective_effects.global,
                          effects: options.customization.selective_effects.global.effects?.map(
                            (effect) => {
                              const { type, ...otherProps } = effect;
                              return {
                                ...otherProps,
                                effect_type: type || effect.effect_type,
                              };
                            }
                          ),
                        },
                      }),
                    }
                  : undefined,
                frame_style: options.customization.frame_style || options.customization.frameStyle,
                logo: options.customization.logo,
                logo_size_ratio:
                  options.customization.logo_size_ratio || options.customization.logoSizeRatio,
              }
            : undefined,
        }
      : {};

    // Log what we're sending to Rust
    logger.info('Sending to Rust v3 Enhanced:', {
      data,
      options: transformedOptions,
      logoSizeRatio: transformedOptions?.customization?.logo_size_ratio,
      hasLogo: !!transformedOptions?.customization?.logo,
      logoData: transformedOptions?.customization?.logo?.data?.substring(0, 50) + '...',
      selectiveEffects: JSON.stringify(
        transformedOptions?.customization?.selective_effects,
        null,
        2
      ),
    });

    // Llamar al generador Rust v3 Enhanced
    const response = await axios.post(
      `${rustGeneratorUrl}/api/v3/qr/enhanced`,
      {
        data,
        options: transformedOptions,
      },
      {
        timeout: 10000, // Mayor timeout para procesamiento más complejo
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const rustResponse = response.data;

    // Debug log to check overlays and definitions
    logger.info('Rust response structure:', {
      hasOverlays: !!rustResponse.data?.overlays,
      overlaysKeys: rustResponse.data?.overlays ? Object.keys(rustResponse.data.overlays) : null,
      hasLogo: !!rustResponse.data?.overlays?.logo,
      dataKeys: rustResponse.data ? Object.keys(rustResponse.data) : null,
      hasDefinitions: !!rustResponse.data?.definitions,
      definitionsCount: rustResponse.data?.definitions?.length || 0,
      definitions:
        rustResponse.data?.definitions?.map((d: any) => ({
          type: d.type,
          id: d.id,
          gradientType: d.gradient_type,
        })) || [],
    });

    // Si la generación fue exitosa, incrementar uso
    if (rustResponse.success && req.user) {
      try {
        // await incrementUsage(req.user.id, 'qrcode_enhanced'); // TODO: Implement usage tracking
      } catch (usageError) {
        logger.error('Failed to increment enhanced usage', {
          userId: req.user.id,
          error: usageError,
        });
      }
    }

    // Calcular scannability score
    let scannabilityAnalysis = null;
    if (rustResponse.success && options?.customization) {
      try {
        scannabilityAnalysis = scannabilityService.calculateScore(options.customization);
        logger.info('Scannability score calculated', {
          score: scannabilityAnalysis.score,
          issueCount: scannabilityAnalysis.issues.length,
        });
      } catch (scoreError) {
        logger.error('Failed to calculate scannability score', {
          error: scoreError,
        });
        // No fallar la solicitud por esto
      }
    }

    // Agregar tiempo total de procesamiento
    const totalTime = Date.now() - startTime;

    // Responder con los datos estructurados enhanced
    res.json({
      ...rustResponse,
      metadata: {
        ...rustResponse.metadata,
        total_processing_time_ms: totalTime,
        backend_version: '1.0.0-enhanced',
      },
      // Incluir análisis de escaneabilidad si está disponible
      ...(scannabilityAnalysis && { scannability: scannabilityAnalysis }),
    });
  } catch (error: any) {
    logger.error('QR v3 Enhanced generation error', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    // Manejar errores de validación del servicio Rust
    if (error.response?.status === 422) {
      const rustError = error.response.data;
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid QR customization options',
          details: rustError || 'The QR customization options are not valid',
        },
      });
    }

    // Manejar errores de red
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'QR generation service is temporarily unavailable',
        },
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      },
    });
  }
});

/**
 * GET /api/v3/qr/capabilities
 * Get v3 engine capabilities and features
 */
router.get('/capabilities', async (req, res) => {
  res.json({
    version: '3.0.0',
    features: {
      structured_data: true,
      qr_v3: true,
      quiet_zone_configurable: false, // Hardcoded to 4
      max_data_length: 2953,
      error_correction_levels: ['L', 'M', 'Q', 'H'],
      output_formats: ['structured_json'],
      enhanced_features: {
        gradients: ['linear', 'radial', 'conic', 'diamond', 'spiral'],
        eye_shapes: [
          'square',
          'rounded_square',
          'circle',
          'dot',
          'leaf',
          'bars_horizontal',
          'bars_vertical',
          'star',
          'diamond',
          'cross',
          'hexagon',
          'heart',
          'shield',
          'crystal',
          'flower',
          'arrow',
        ],
        eye_border_styles: [
          'square',
          'rounded_square',
          'circle',
          'quarter_round',
          'cut_corner',
          'thick_border',
          'double_border',
          'diamond',
          'hexagon',
          'cross',
          'star',
          'leaf',
          'arrow',
          // Formas orgánicas (Fase 2.1)
          'teardrop',
          'wave',
          'petal',
          'crystal',
          'flame',
          'organic',
          // Propuestas temporales
          'propuesta01',
        ],
        eye_center_styles: [
          'square',
          'rounded_square',
          'circle',
          'dot',
          'star',
          'diamond',
          'cross',
          'plus',
        ],
        data_patterns: [
          'square',
          'square_small',
          'dots',
          'rounded',
          'vertical',
          'horizontal',
          'diamond',
          'circular',
          'star',
          'cross',
          'random',
          'wave',
          'mosaic',
        ],
        effects: [
          'shadow',
          'glow',
          'blur',
          'noise',
          'vintage',
          'distort',
          'emboss',
          'outline',
          'drop_shadow',
          'inner_shadow',
        ],
        selective_effects: {
          supported_components: ['eyes', 'data', 'frame', 'global'],
          blend_modes: [
            'normal',
            'multiply',
            'screen',
            'overlay',
            'soft_light',
            'hard_light',
            'color_dodge',
            'color_burn',
            'darken',
            'lighten',
            'difference',
            'exclusion',
          ],
          max_effects_per_component: 3,
          render_priority_range: [0, 10],
        },
        overlays: ['logo', 'frame'],
      },
    },
    benefits: {
      security: 'No dangerouslySetInnerHTML required',
      performance: '50% less data transfer',
      flexibility: 'Frontend controls rendering',
      customization: 'Full visual customization with enhanced API',
    },
  });
});

// Batch generation endpoint
const batchRequestSchema = z.object({
  codes: z.array(qrV3RequestSchema).min(1).max(50),
  options: z
    .object({
      maxConcurrent: z.number().min(1).max(20).default(10),
      includeMetadata: z.boolean().default(true),
      stopOnError: z.boolean().default(false),
    })
    .optional(),
});

router.post('/batch', generationRateLimit, async (req, res) => {
  try {
    const validation = batchRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid batch request',
          details: validation.error.errors,
        },
      });
    }

    const { codes, options } = validation.data;
    const results = [];
    const rustGeneratorUrl = process.env.RUST_GENERATOR_URL || 'http://localhost:3002';

    // Process in chunks for better performance
    const chunkSize = options?.maxConcurrent || 10;
    for (let i = 0; i < codes.length; i += chunkSize) {
      const chunk = codes.slice(i, i + chunkSize);
      const promises = chunk.map(async (codeRequest) => {
        try {
          const response = await axios.post(`${rustGeneratorUrl}/api/v3/qr/enhanced`, codeRequest, {
            timeout: 5000,
          });
          return {
            success: true,
            data: response.data.data,
            index: i + chunk.indexOf(codeRequest),
          };
        } catch (error) {
          if (options?.stopOnError) {
            throw error;
          }
          return {
            success: false,
            error: error.message,
            index: i + chunk.indexOf(codeRequest),
          };
        }
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      data: {
        results: options?.includeMetadata ? results : results.map((r) => r.data),
        summary: {
          total: codes.length,
          successful,
          failed,
          processingTime: Date.now() - req.startTime,
        },
      },
    });
  } catch (error) {
    logger.error('Batch generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_GENERATION_ERROR',
        message: error.message,
      },
    });
  }
});

// Preview endpoint with GET support
router.get('/preview', generationRateLimit, async (req, res) => {
  try {
    // Parse query parameters
    const data = req.query.data as string;
    if (!data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data parameter is required',
        },
      });
    }

    // Build options from query params
    const options: any = {
      error_correction: req.query.error_correction || 'M',
      customization: {},
    };

    // Parse customization options
    if (req.query.eye_shape) {
      options.customization.eye_shape = req.query.eye_shape;
    }
    if (req.query.data_pattern) {
      options.customization.data_pattern = req.query.data_pattern;
    }
    if (req.query.fg_color || req.query.bg_color) {
      options.customization.colors = {
        foreground: req.query.fg_color || '#000000',
        background: req.query.bg_color || '#FFFFFF',
      };
    }

    const rustGeneratorUrl = process.env.RUST_GENERATOR_URL || 'http://localhost:3002';

    // Generate QR
    const response = await axios.post(
      `${rustGeneratorUrl}/api/v3/qr/enhanced`,
      { data, options },
      { timeout: 5000 }
    );

    // Cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({
      success: true,
      data: response.data.data,
      metadata: {
        cached: false,
        engine_version: '3.0.0',
      },
    });
  } catch (error) {
    logger.error('Preview generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: error.message,
      },
    });
  }
});

// Validation endpoint (already exists in v2, keeping for compatibility)
router.post('/validate', async (req, res) => {
  try {
    const validation = qrV3RequestSchema.safeParse(req.body);

    res.json({
      success: validation.success,
      errors: validation.success ? null : validation.error.errors,
      metadata: validation.success
        ? {
            dataLength: validation.data.data.length,
            maxCapacity: 2953,
            estimatedVersion: Math.ceil(validation.data.data.length / 100),
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
  }
});

export default router;
