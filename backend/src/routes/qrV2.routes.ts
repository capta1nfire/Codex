import { Router } from 'express';
import { z } from 'zod';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { generationRateLimit } from '../middleware/rateLimitMiddleware.js';
import { validateBody as validationMiddleware } from '../middleware/validationMiddleware.js';
import qrEngineV2Service from '../services/qrEngineV2Service.js';
import logger from '../utils/logger.js';
// import { metrics } from '../utils/metrics.js';

const router = Router();

// Validation schemas
const qrV2OptionsSchema = z.object({
  size: z.number().min(100).max(1000).optional(),
  margin: z.number().min(0).max(20).optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).optional(),
  eyeShape: z.string().optional(),
  dataPattern: z.string().optional(),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  eyeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  gradient: z
    .object({
      type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']),
      colors: z
        .array(z.string().regex(/^#[0-9A-Fa-f]{6}$/))
        .min(2)
        .max(5),
      angle: z.number().min(0).max(360).optional(),
      applyToEyes: z.boolean().optional(),
      applyToData: z.boolean().optional(),
      strokeStyle: z
        .object({
          enabled: z.boolean(),
          color: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
          width: z.number().min(0).max(5).optional(),
          opacity: z.number().min(0).max(1).optional(),
        })
        .optional(),
    })
    .optional(),
  logo: z
    .object({
      data: z.string(), // Base64
      size: z.number().min(10).max(50).optional(),
      padding: z.number().min(0).max(20).optional(),
      backgroundColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      shape: z.enum(['square', 'circle', 'rounded']).optional(),
    })
    .optional(),
  frame: z
    .object({
      style: z.enum(['simple', 'rounded', 'bubble', 'speech', 'badge']),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      width: z.number().min(1).max(10).optional(),
      text: z.string().max(50).optional(),
      textPosition: z.enum(['top', 'bottom', 'left', 'right']).optional(),
    })
    .optional(),
  effects: z
    .array(
      z.object({
        type: z.enum(['shadow', 'glow', 'blur', 'noise', 'vintage']),
        intensity: z.number().min(0).max(1).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        offsetX: z.number().optional(),
        offsetY: z.number().optional(),
        blurRadius: z.number().optional(),
      })
    )
    .optional(),
});

const qrV2GenerateSchema = z.object({
  data: z.string().min(1).max(4000),
  options: qrV2OptionsSchema.optional(),
});

const qrV2BatchSchema = z.object({
  codes: z.array(qrV2GenerateSchema).min(1).max(100),
  options: z
    .object({
      maxConcurrent: z.number().min(1).max(20).optional(),
      includeMetadata: z.boolean().optional(),
    })
    .optional(),
});

// Generate QR code with v2 engine
router.post(
  '/generate',
  authMiddleware.optionalAuth,
  generationRateLimit,
  validationMiddleware(qrV2GenerateSchema),
  async (req, res, next) => {
    try {
      const startTime = Date.now();
      const { data, options } = req.body;

      logger.info('QR v2 generation request', {
        userId: req.user?.id,
        dataLength: data.length,
        hasOptions: !!options,
        data: data,
        options: options,
      });

      // Track metrics
      // metrics.increment('qr_v2.generation.requests');

      const result = await qrEngineV2Service.generate({ data, options });

      // Track success metrics
      // metrics.increment('qr_v2.generation.success');
      // metrics.timing('qr_v2.generation.duration', Date.now() - startTime);
      // metrics.gauge('qr_v2.generation.processing_time', result.metadata.processingTimeMs);

      if (result.cached) {
        // metrics.increment('qr_v2.cache.hits');
      } else {
        // metrics.increment('qr_v2.cache.misses');
      }

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      // metrics.increment('qr_v2.generation.errors');
      next(error);
    }
  }
);

// Validate QR code data and options
router.post(
  '/validate',
  authMiddleware.optionalAuth,
  validationMiddleware(qrV2GenerateSchema),
  async (req, res, next) => {
    try {
      const { data, options } = req.body;

      const result = await qrEngineV2Service.validate({ data, options });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Batch generate QR codes (authenticated only)
router.post(
  '/batch',
  authMiddleware.authenticateJwt,
  validationMiddleware(qrV2BatchSchema),
  async (req, res, next) => {
    try {
      const startTime = Date.now();
      const { codes, options } = req.body;

      logger.info('QR v2 batch generation request', {
        userId: req.user?.id,
        codesCount: codes.length,
      });

      // metrics.increment('qr_v2.batch.requests');
      // metrics.gauge('qr_v2.batch.size', codes.length);

      const result = await qrEngineV2Service.batch(codes);

      // metrics.increment('qr_v2.batch.success');
      // metrics.timing('qr_v2.batch.duration', Date.now() - startTime);
      // metrics.gauge('qr_v2.batch.successful', result.summary.successful);
      // metrics.gauge('qr_v2.batch.failed', result.summary.failed);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      // metrics.increment('qr_v2.batch.errors');
      next(error);
    }
  }
);

// Get preview URL
router.get('/preview-url', (req, res) => {
  const { data, eyeShape, dataPattern, fgColor, bgColor, size } = req.query;

  if (!data || typeof data !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Data parameter is required',
    });
  }

  const previewUrl = qrEngineV2Service.getPreviewUrl({
    data,
    eyeShape: eyeShape as string,
    dataPattern: dataPattern as string,
    fgColor: fgColor as string,
    bgColor: bgColor as string,
    size: size ? parseInt(size as string) : undefined,
  });

  res.json({
    success: true,
    previewUrl,
  });
});

// Cache management (admin only)
router.get(
  '/cache/stats',
  authMiddleware.authenticateJwt,
  authMiddleware.checkRole(['ADMIN', 'SUPERADMIN']),
  async (req, res, next) => {
    try {
      const stats = await qrEngineV2Service.getCacheStats();
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/cache/clear',
  authMiddleware.authenticateJwt,
  authMiddleware.checkRole(['ADMIN', 'SUPERADMIN']),
  async (req, res, next) => {
    try {
      const cleared = await qrEngineV2Service.clearCache();
      res.json({
        success: cleared,
        message: cleared ? 'Cache cleared successfully' : 'Failed to clear cache',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Compatibility endpoint - converts old format to v2
router.post(
  '/generate-compat',
  authMiddleware.optionalAuth,
  generationRateLimit,
  async (req, res, next) => {
    try {
      const startTime = Date.now();

      // Convert old format to v2
      const v2Request = qrEngineV2Service.convertFromOldFormat(req.body);

      logger.info('QR v2 compatibility generation', {
        userId: req.user?.id,
        originalType: req.body.barcode_type,
      });

      const v2Response = await qrEngineV2Service.generate(v2Request);

      // Convert v2 response to old format
      const oldFormatResponse = qrEngineV2Service.convertToOldFormat(v2Response);

      // metrics.increment('qr_v2.compat.requests');
      // metrics.timing('qr_v2.compat.duration', Date.now() - startTime);

      res.json(oldFormatResponse);
    } catch (error) {
      // metrics.increment('qr_v2.compat.errors');
      next(error);
    }
  }
);

export default router;
