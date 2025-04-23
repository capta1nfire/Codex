import { z } from 'zod';

export const generateSchema = z.object({
  barcode_type: z.string().nonempty('El tipo de código de barras es obligatorio'),
  data: z.string()
    .nonempty('Los datos a codificar son obligatorios')
    .max(1000, 'Los datos a codificar no pueden exceder 1000 caracteres')
    .transform(str => str.trim()),
  options: z
    .object({
      scale: z.number().int().min(1).max(10).optional(),
      fgcolor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'El color de primer plano debe ser un hex válido').optional(),
      bgcolor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'El color de fondo debe ser un hex válido').optional(),
      height: z.number().int().min(10).max(500).optional(),
      includetext: z.boolean().optional(),
      ecl: z.enum(['L', 'M', 'Q', 'H']).optional(),
    })
    .optional(),
}); 