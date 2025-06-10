// Imports correctos:
import express, { Request, Response, NextFunction } from 'express';

import { config } from '../config.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generationRateLimit, rateLimitMonitor, authenticatedRateLimit } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { generateSchema } from '../schemas/generateSchemas.js'; // Esquema Plural
import { generateBarcode, generateBarcodesBatch } from '../services/barcodeService.js'; // Servicio
import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js'; // Logger desde utils

const router = express.Router();

/**
 * @openapi
 * /api/generate:
 *   post:
 *     tags: [Generation]
 *     summary: Genera un código de barras o QR
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode_type
 *               - data
 *             properties:
 *               barcode_type:
 *                 type: string
 *                 enum: [qrcode, code128, ean13, ean8, code39, datamatrix]
 *               data:
 *                 type: string
 *               options:
 *                 type: object
 *     responses:
 *       200:
 *         description: Código generado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       429:
 *         description: Demasiadas solicitudes
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/',
  rateLimitMonitor,
  authMiddleware.optionalAuth, // Auth opcional que permite request sin auth pero reconoce usuarios logueados
  authenticatedRateLimit, // Usa authenticatedRateLimit que respeta roles SUPERADMIN
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { barcode_type, data, options } = req.body;

      // Validación básica
      if (!barcode_type || !data) {
        throw new AppError(
          'Faltan parámetros requeridos: barcode_type y data',
          400,
          ErrorCode.BAD_REQUEST
        );
      }

      logger.info(`[Route:/] Solicitud recibida para tipo: ${barcode_type}`);
      const svgString = await generateBarcode(barcode_type, data, options);
      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      return res.status(200).json({ success: true, svgString });
    } catch (error: unknown) {
      logger.error(`[Route:/] Error: ${error instanceof Error ? error.message : error}`);
      return next(error);
    }
  }
);

/**
 * @openapi
 * /api/generate/batch:
 *   post:
 *     tags: [Generation]
 *     summary: Genera múltiples códigos de barras en batch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcodes
 *             properties:
 *               barcodes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - barcode_type
 *                     - data
 *                   properties:
 *                     id:
 *                       type: string
 *                     barcode_type:
 *                       type: string
 *                     data:
 *                       type: string
 *                     options:
 *                       type: object
 *               options:
 *                 type: object
 *                 properties:
 *                   max_concurrent:
 *                     type: number
 *                     default: 10
 *                   fail_fast:
 *                     type: boolean
 *                     default: false
 *                   include_metadata:
 *                     type: boolean
 *                     default: true
 *     responses:
 *       200:
 *         description: Batch procesado exitosamente
 *       400:
 *         description: Error en la solicitud
 *       429:
 *         description: Demasiadas solicitudes
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/batch',
  rateLimitMonitor,
  authMiddleware.optionalAuth,
  generationRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { barcodes, options } = req.body;

      // Validación básica
      if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
        throw new AppError(
          'Se requiere un array de códigos de barras no vacío',
          400,
          ErrorCode.BAD_REQUEST
        );
      }

      // Validar límite de batch
      const MAX_BATCH_SIZE = 100;
      if (barcodes.length > MAX_BATCH_SIZE) {
        throw new AppError(
          `El batch excede el tamaño máximo permitido (${barcodes.length} > ${MAX_BATCH_SIZE})`,
          400,
          ErrorCode.BAD_REQUEST,
          { suggestion: `Divida el batch en grupos de máximo ${MAX_BATCH_SIZE} códigos` }
        );
      }

      // Validar estructura de cada código
      for (let i = 0; i < barcodes.length; i++) {
        const barcode = barcodes[i];
        if (!barcode.barcode_type || !barcode.data) {
          throw new AppError(
            `Código #${i + 1}: faltan parámetros requeridos (barcode_type y data)`,
            400,
            ErrorCode.BAD_REQUEST
          );
        }
      }

      logger.info(`[Route:/batch] Procesando batch con ${barcodes.length} códigos`);
      const result = await generateBarcodesBatch(barcodes, options);

      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      return res.status(200).json(result);
    } catch (error: unknown) {
      logger.error(`[Route:/batch] Error: ${error instanceof Error ? error.message : error}`);
      return next(error);
    }
  }
);

export const generateRoutes = router;
