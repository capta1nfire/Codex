// Imports correctos:
import express, { Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validationMiddleware.js';
import { generateSchema } from '../schemas/generateSchemas.js'; // Esquema Plural
import { config } from '../config.js';
import { generateBarcode } from '../services/barcodeService.js'; // Servicio
import logger from '../utils/logger.js'; // Logger desde utils
import { authMiddleware } from '../middleware/authMiddleware.js';
import { generationRateLimit, rateLimitMonitor } from '../middleware/rateLimitMiddleware.js';
import { AppError, ErrorCode } from '../utils/errors.js';

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
  generationRateLimit,
  authMiddleware.optionalAuth, // Auth opcional para distinguir usuarios
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

export const generateRoutes = router;
