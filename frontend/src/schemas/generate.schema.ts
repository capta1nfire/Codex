import { z } from 'zod';

// Tipos válidos para ECL (Error Correction Level) en QR
const validEclLevels = ['L', 'M', 'Q', 'H'] as const;

// Esquema Zod para validar los datos del formulario de generación
export const generateFormSchema = z.object({
  barcode_type: z.string().nonempty('Selecciona un tipo de código'),
  data: z.string()
    .nonempty('Introduce los datos a codificar')
    .max(1000, 'Los datos no pueden exceder los 1000 caracteres')
    .transform((str: string) => str.trim()),
  options: z
    .object({
      // Opciones comunes
      scale: z.number({ invalid_type_error: 'La escala debe ser un número' })
        .int()
        .min(1, 'La escala debe ser al menos 1')
        .max(10, 'La escala no puede ser mayor que 10')
        .optional(),
      fgcolor: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FF0000)')
        .optional()
        .or(z.literal('')), // Permitir vacío para usar el default
      bgcolor: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FFFFFF)')
        .optional()
        .or(z.literal('')), // Permitir vacío para usar el default

      // Opciones específicas 1D (ej. Code128)
      height: z.number({ invalid_type_error: 'La altura debe ser un número' })
        .int()
        .min(10, 'La altura debe ser al menos 10')
        .max(500, 'La altura no puede ser mayor que 500')
        .optional(),
      includetext: z.boolean().optional(),

      // Opciones específicas QR
      ecl: z.enum(validEclLevels, { invalid_type_error: 'Nivel ECL inválido' }).optional(),
    })
    .optional(),
});

// Tipo inferido para usar en el formulario
export type GenerateFormData = z.infer<typeof generateFormSchema>; 