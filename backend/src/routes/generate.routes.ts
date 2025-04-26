import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validationMiddleware.js';
import { generateSchema } from '../schemas/generateSchemas.js';
import { config } from '../config.js';
import { generateBarcode } from '../services/barcodeService.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * @openapi
 * /api/generate:
 *   post:
 *     tags:
 *       - Generation
 *     summary: Generar código de barras o QR
 *     description: Genera un código de barras o QR en formato SVG según los parámetros proporcionados.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateInput'
 *     responses:
 *       200:
 *         description: Código generado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 svgString:
 *                   type: string
 *                   format: svg
 *                   description: El código generado como string SVG.
 *       400:
 *         description: Error de validación en los datos de entrada o parámetros inválidos para el tipo de código.
 *       500:
 *         description: Error interno del servidor (ej. fallo al contactar servicio Rust).
 *       503:
 *         description: Servicio de generación no disponible.
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
 * @openapi
 * /api/generator:
 *   post:
 *     tags:
 *       - Generation
 *     summary: Generar código de barras o QR (alias)
 *     description: Alias del endpoint `/api/generate`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateInput'
 *     responses:
 *       200:
 *         description: Código generado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 svgString:
 *                   type: string
 *                   format: svg
 *                   description: El código generado como string SVG.
 *       400:
 *         description: Error de validación o parámetros inválidos.
 *       500:
 *         description: Error interno del servidor.
 *       503:
 *         description: Servicio de generación no disponible.
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
