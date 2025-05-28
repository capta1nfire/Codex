import { z } from 'zod';

/**
 * @openapi
 * components:
 *   schemas:
 *     GenerateInput:
 *       type: object
 *       required:
 *         - barcode_type
 *         - data
 *       properties:
 *         barcode_type:
 *           type: string
 *           description: Tipo de código de barras a generar (ej. qrcode, code128).
 *           example: qrcode
 *         data:
 *           type: string
 *           description: Datos a codificar en el código de barras.
 *           maxLength: 1000
 *           example: 'https://ejemplo.com'
 *         options:
 *           type: object
 *           description: Opciones de personalización (opcional).
 *           properties:
 *             scale:
 *               type: integer
 *               description: Factor de escala (tamaño).
 *               minimum: 1
 *               maximum: 10
 *               example: 4
 *             fgcolor:
 *               type: string
 *               format: color-hex
 *               description: Color de primer plano en hexadecimal.
 *               example: '#000000'
 *             bgcolor:
 *               type: string
 *               format: color-hex
 *               description: Color de fondo en hexadecimal.
 *               example: '#FFFFFF'
 *             height:
 *               type: integer
 *               description: Altura del código en píxeles (para códigos 1D).
 *               minimum: 10
 *               maximum: 500
 *               example: 100
 *             includetext:
 *               type: boolean
 *               description: Incluir el texto debajo del código (para códigos 1D).
 *               example: true
 *             ecl:
 *               type: string
 *               enum: [L, M, Q, H]
 *               description: Nivel de corrección de errores para QR Code.
 *               example: M
 */
export const generateSchema = z.object({
  barcode_type: z.string().nonempty('El tipo de código de barras es obligatorio'),
  data: z
    .string()
    .nonempty('Los datos a codificar son obligatorios')
    .max(1000, 'Los datos a codificar no pueden exceder 1000 caracteres')
    .transform((str) => str.trim()),
  options: z
    .object({
      scale: z.number().int().min(1).max(10).optional(),
      fgcolor: z
        .string()
        .regex(/^#([0-9A-Fa-f]{6})$/, 'El color de primer plano debe ser un hex válido')
        .optional(),
      bgcolor: z
        .string()
        .regex(/^#([0-9A-Fa-f]{6})$/, 'El color de fondo debe ser un hex válido')
        .optional(),
      height: z.number().int().min(10).max(500).optional(),
      includetext: z.boolean().optional(),
      ecl: z.enum(['L', 'M', 'Q', 'H']).optional(),
    })
    .optional(),
});
