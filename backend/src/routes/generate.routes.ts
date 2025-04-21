import { Router, Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';

import { config } from '../config'; // Para CACHE_MAX_AGE
import { generateBarcode } from '../services/barcodeService';
import logger from '../utils/logger';

const router = Router();

// Middleware para validación de solicitudes (copiado de index.ts, podría ir a utils)
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Devolver el error en el formato estándar podría ser mejor,
    // pero por ahora mantenemos el formato original de index.ts
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array(),
    });
  }
  next();
};

// Validadores para el endpoint de generación (copiados de index.ts)
const generateValidators = [
  check('barcode_type')
    .exists()
    .withMessage('El tipo de código de barras es obligatorio')
    .isString()
    .withMessage('El tipo de código de barras debe ser un string'),

  check('data')
    .exists()
    .withMessage('Los datos a codificar son obligatorios')
    .isString()
    .withMessage('Los datos a codificar deben ser un string')
    .trim()
    .notEmpty()
    .withMessage('Los datos a codificar no pueden estar vacíos')
    .isLength({ max: 1000 })
    .withMessage('Los datos a codificar no pueden exceder 1000 caracteres'),

  check('options').optional().isObject().withMessage('Las opciones deben ser un objeto'),
];

// Ruta principal para generar códigos (ahora en /api/generate)
router.post(
  '/generate',
  generateValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const { barcode_type, data, options } = req.body;

    try {
      logger.info(`[Route:/generate] Solicitud recibida para tipo: ${barcode_type}`);
      const svgString = await generateBarcode(barcode_type, data, options);

      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      res.status(200).json({
        success: true,
        svgString,
      });
    } catch (error) {
      logger.error(
        `[Route:/generate] Error procesando solicitud: ${error instanceof Error ? error.message : error}`
      );
      next(error);
    }
  }
);

// Ruta alias /generator (ahora en /api/generator)
router.post(
  '/generator',
  generateValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    // La lógica es idéntica a la ruta principal '/' en este router
    const { barcode_type, data, options } = req.body;

    try {
      logger.info(`[Route:/generator] Solicitud recibida para tipo: ${barcode_type}`);
      const svgString = await generateBarcode(barcode_type, data, options);

      res.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
      res.status(200).json({
        success: true,
        svgString,
      });
    } catch (error) {
      logger.error(
        `[Route:/generator] Error procesando solicitud: ${error instanceof Error ? error.message : error}`
      );
      next(error);
    }
  }
);

export const generateRoutes = router;
