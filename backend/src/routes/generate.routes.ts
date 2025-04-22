import { Router, Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';

import { config } from '../config.js'; // Para CACHE_MAX_AGE
import { generateBarcode } from '../services/barcodeService.js';
import logger from '../utils/logger.js';

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

// Validadores para el endpoint de generación
const generateValidators = [
  check('barcode_type')
    .exists().withMessage('El tipo de código de barras es obligatorio')
    .isString().withMessage('El tipo de código de barras debe ser un string'),

  check('data')
    .exists().withMessage('Los datos a codificar son obligatorios')
    .isString().withMessage('Los datos a codificar deben ser un string')
    .trim()
    .notEmpty().withMessage('Los datos a codificar no pueden estar vacíos')
    .isLength({ max: 1000 }).withMessage('Los datos a codificar no pueden exceder 1000 caracteres'),

  // Validaciones para el objeto options y sus propiedades
  check('options').optional().isObject().withMessage('Las opciones deben ser un objeto'),

  check('options.scale')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('La escala debe ser un entero entre 1 y 10'),

  check('options.fgcolor') // Color de primer plano
    .optional()
    .isHexColor().withMessage('El color de primer plano (fgcolor) debe ser un código hexadecimal válido (ej. #000000)'),

  check('options.bgcolor') // Color de fondo
    .optional()
    .isHexColor().withMessage('El color de fondo (bgcolor) debe ser un código hexadecimal válido (ej. #FFFFFF)'),

  check('options.height') // Altura
    .optional()
    .isInt({ min: 10, max: 500 }).withMessage('La altura debe ser un entero entre 10 y 500'), // Rango ejemplo, ajustar si es necesario

  check('options.includetext') // Incluir texto legible
    .optional()
    .isBoolean().withMessage('La opción includetext debe ser un valor booleano (true/false)'),

  check('options.ecl') // Nivel de corrección de errores QR
    .optional()
    .isString().withMessage('El nivel de corrección de errores (ecl) debe ser un string')
    .isIn(['L', 'M', 'Q', 'H']).withMessage('El nivel de corrección de errores (ecl) debe ser L, M, Q, o H'),
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
