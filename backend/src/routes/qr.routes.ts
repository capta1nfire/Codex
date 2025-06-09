import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generationRateLimit, rateLimitMonitor } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { qrGenerateSchema, qrPreviewSchema } from '../schemas/qrSchemas.js';
import { 
  generateQRv2, 
  generateQRBatch, 
  getQRPreview,
  validateQRData 
} from '../services/qrService.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @openapi
 * /api/qr/generate:
 *   post:
 *     tags: [QR Engine v2]
 *     summary: Generate QR code with advanced customization (v2 engine)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QRGenerateRequest'
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 svg:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 performance:
 *                   type: object
 */
router.post(
  '/generate',
  rateLimitMonitor,
  authMiddleware.optionalAuth,
  generationRateLimit,
  validateBody(qrGenerateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();
      
      logger.info('[QR v2] Generate request received', {
        userId: req.user?.id,
        dataLength: req.body.data.length,
        hasCustomization: !!req.body.options
      });

      const result = await generateQRv2(req.body);
      
      const processingTime = Date.now() - startTime;
      
      res.status(200).json({
        success: true,
        svg: result.svg,
        metadata: result.metadata,
        performance: {
          processingTimeMs: processingTime,
          engineVersion: '2.0.0',
          cached: result.cached || false
        }
      });
    } catch (error) {
      logger.error('[QR v2] Generation error:', error);
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/qr/batch:
 *   post:
 *     tags: [QR Engine v2]
 *     summary: Generate multiple QR codes in batch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/QRGenerateRequest'
 *               options:
 *                 type: object
 *                 properties:
 *                   maxConcurrent:
 *                     type: number
 *                     default: 10
 *                   includeMetadata:
 *                     type: boolean
 *                     default: true
 */
router.post(
  '/batch',
  rateLimitMonitor,
  authMiddleware.optionalAuth,
  generationRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codes, options } = req.body;
      
      if (!codes || !Array.isArray(codes) || codes.length === 0) {
        throw new AppError('Codes array is required', 400, ErrorCode.VALIDATION_ERROR);
      }

      const MAX_BATCH_SIZE = 50; // Lower limit for QR v2 due to complexity
      if (codes.length > MAX_BATCH_SIZE) {
        throw new AppError(
          `Batch size exceeds maximum (${codes.length} > ${MAX_BATCH_SIZE})`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      logger.info(`[QR v2] Batch processing ${codes.length} codes`);
      
      const result = await generateQRBatch(codes, options);
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('[QR v2] Batch error:', error);
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/qr/preview:
 *   get:
 *     tags: [QR Engine v2]
 *     summary: Get real-time QR preview with query parameters
 *     parameters:
 *       - in: query
 *         name: data
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: eyeShape
 *         schema:
 *           type: string
 *       - in: query
 *         name: dataPattern
 *         schema:
 *           type: string
 *       - in: query
 *         name: fgColor
 *         schema:
 *           type: string
 *       - in: query
 *         name: bgColor
 *         schema:
 *           type: string
 */
router.get(
  '/preview',
  rateLimitMonitor,
  validateBody(qrPreviewSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getQRPreview(req.query);
      
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(result.svg);
    } catch (error) {
      logger.error('[QR v2] Preview error:', error);
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/qr/validate:
 *   post:
 *     tags: [QR Engine v2]
 *     summary: Validate QR data and options
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QRGenerateRequest'
 */
router.post(
  '/validate',
  validateBody(qrGenerateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = await validateQRData(req.body);
      
      res.status(200).json({
        success: true,
        valid: validation.valid,
        details: validation.details,
        suggestions: validation.suggestions
      });
    } catch (error) {
      logger.error('[QR v2] Validation error:', error);
      next(error);
    }
  }
);

export const qrRoutes = router;