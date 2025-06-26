import { z } from 'zod';

// Tipos válidos para ECL (Error Correction Level) en QR
const validEclLevels = ['L', 'M', 'Q', 'H'] as const;

// Esquema Zod para validar los datos del formulario de generación
export const generateFormSchema = z.object({
  barcode_type: z.string().nonempty('Por favor, selecciona un tipo de código'),
  data: z
    .string()
    .nonempty('')  // No message, handled by smart validation
    .max(1000, 'Los datos no pueden exceder los 1000 caracteres')
    .transform((str: string) => str.trim()),
  options: z
    .object({
      // Opciones comunes
      scale: z
        .number({ invalid_type_error: 'La escala debe ser un número' })
        .int()
        .min(1, 'La escala debe ser al menos 1')
        .max(10, 'La escala no puede ser mayor que 10')
        .optional(),
      fgcolor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FF0000)')
        .optional()
        .or(z.literal('')), // Permitir vacío para usar el default
      bgcolor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FFFFFF)')
        .optional()
        .or(z.literal('')), // Permitir vacío para usar el default

      // Opciones de gradiente (principalmente para QR)
      gradient_enabled: z.boolean().optional(),
      gradient_type: z.enum(['linear', 'radial']).optional(),
      gradient_color1: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FF0000)')
        .optional()
        .or(z.literal('')),
      gradient_color2: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #0000FF)')
        .optional()
        .or(z.literal('')),
      gradient_direction: z.enum(['top-bottom', 'left-right', 'diagonal', 'center-out']).optional(),
      gradient_borders: z.boolean().optional(), // Control para mostrar/ocultar bordes en gradientes

      // Opciones específicas 1D (ej. Code128)
      height: z
        .number({ invalid_type_error: 'La altura debe ser un número' })
        .int()
        .min(10, 'La altura debe ser al menos 10')
        .max(500, 'La altura no puede ser mayor que 500')
        .optional(),
      includetext: z.boolean().optional(),

      // Opciones específicas QR
      ecl: z.enum(validEclLevels, { invalid_type_error: 'Nivel ECL inválido' }).optional(),
      qr_version: z
        .union([
          z.number().int().min(1).max(40, 'Versión debe estar entre 1 y 40'),
          z.literal('Auto'),
        ])
        .optional(),
      qr_mask_pattern: z
        .union([
          z.number().int().min(0).max(7, 'Máscara debe estar entre 0 y 7'),
          z.literal('Auto'),
        ])
        .optional(),
      eci_mode: z.string().optional(), // Asumimos string por ahora

      // Opciones específicas Code 128
      code128_codeset: z.enum(['Auto', 'A', 'B', 'C']).optional(),
      code128_gs1: z.boolean().optional(),

      // Opciones EAN/UPC
      ean_upc_complement: z
        .string()
        .regex(/^[0-9]{2}$|^[0-9]{5}$/, 'Complemento debe ser 2 o 5 dígitos')
        .optional()
        .or(z.literal('')),
      ean_upc_hri_position: z.enum(['bottom', 'top', 'none']).optional(), // Asumiendo valores posibles
      ean_upc_quiet_zone: z.number().int().min(0).optional(), // Asumiendo número de módulos

      // Opciones PDF417
      pdf417_columns: z.number().int().min(1).optional(),
      pdf417_rows: z.number().int().min(3).optional(),
      pdf417_security_level: z.number().int().min(0).max(8).optional(),
      pdf417_compact: z.boolean().optional(),

      // Opciones Data Matrix
      datamatrix_shape: z.enum(['Auto', 'Square', 'Rectangle']).optional(),
      datamatrix_symbol_size: z.string().optional(), // Podría ser un enum específico o string
      datamatrix_encoding_mode: z.string().optional(), // Podría ser un enum

      // Opciones Code 39
      code39_ratio: z.number().min(2.0).max(3.0).optional(), // Usaremos number para slider/input
      code39_check_digit: z.enum(['None', 'Mod43']).optional(),
      code39_full_ascii: z.boolean().optional(),
      
      // Opciones v3 Enhanced para QR
      eye_shape: z.enum(['square', 'rounded_square', 'circle', 'dot', 'leaf', 'bars-horizontal', 'bars-vertical', 'star', 'diamond', 'cross', 'hexagon', 'heart', 'shield', 'crystal', 'flower', 'arrow', 'custom']).optional(),
      data_pattern: z.enum(['square', 'dots', 'rounded', 'vertical', 'horizontal', 'diamond', 'circular', 'star', 'cross', 'random', 'wave', 'mosaic']).optional(),
      
      // Logo options
      logo_enabled: z.boolean().optional(),
      logo_data: z.string().optional(), // base64 data URL
      logo_size: z.number().min(10).max(30).optional(),
      logo_shape: z.enum(['square', 'circle', 'rounded_square']).optional(),
      logo_padding: z.number().min(0).max(10).optional(),
      
      // Effects
      effects: z.array(z.enum(['shadow', 'glow', 'blur', 'noise', 'vintage'])).optional(),
      
      // Frame options
      frame_enabled: z.boolean().optional(),
      frame_style: z.enum(['simple', 'rounded', 'bubble', 'speech', 'badge']).optional(),
      frame_text: z.string().max(50).optional(),
      frame_text_position: z.enum(['top', 'bottom', 'left', 'right']).optional(),
    })
    .optional(),
});

// Tipo inferido para usar en el formulario
export type GenerateFormData = z.infer<typeof generateFormSchema>;
