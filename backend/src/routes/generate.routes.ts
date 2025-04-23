import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validationMiddleware.js';
import { generateSchema } from '../schemas/generateSchemas.js';
import { config } from '../config.js';
import { generateBarcode } from '../services/barcodeService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @route POST /api/generate
 * @desc Generar código de barras o QR
 * @access Público
 */
router.post(
  '/generate',
  validateBody(generateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { barcode_type, data, options } = req.body;
    try {
      logger.info(`[Route:/generate] Solicitud recibida para tipo: ${barcode_type}`);
      const svgString = await generateBarcode(barcode_type, data, options);
      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      return res.status(200).json({ success: true, svgString });
    } catch (error) {
      logger.error(`[Route:/generate] Error: ${error instanceof Error ? error.message : error}`);
      return next(error);
    }
  }
);

/**
 * @route POST /api/generator
 * @desc Alias endpoint para generación de código
 * @access Público
 */
router.post(
  '/generator',
  validateBody(generateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { barcode_type, data, options } = req.body;
    try {
      logger.info(`[Route:/generator] Solicitud recibida para tipo: ${barcode_type}`);
      const svgString = await generateBarcode(barcode_type, data, options);
      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      return res.status(200).json({ success: true, svgString });
    } catch (error) {
      logger.error(`[Route:/generator] Error: ${error instanceof Error ? error.message : error}`);
      return next(error);
    }
  }
);

export const generateRoutes = router;
