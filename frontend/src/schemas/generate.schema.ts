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
      gradient_angle: z.number().int().min(0).max(360).optional(), // Ángulo del gradiente en grados (0-360)
      gradient_apply_to_eyes: z.boolean().optional(),
      gradient_borders: z.boolean().optional(), // Control para mostrar/ocultar bordes en gradientes
      gradient_border_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(), // Color del borde
      gradient_border_width: z.number().min(0.1).max(3.0).optional(), // Ancho del borde (UI limitado a 0.20 por UX, backend requiere min 0.1)
      gradient_border_opacity: z.number().min(0.1).max(1.0).optional(), // Opacidad del borde (backend requiere min 0.1)
      gradient_per_module: z.boolean().optional(), // Control para aplicar gradiente por módulo
      
      // Background options for QR codes
      transparent_background: z.boolean().optional(),
      bgcolor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido (ej. #FFFFFF)')
        .optional()
        .or(z.literal('')),

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
      use_separated_eye_styles: z.boolean().optional(),
      eye_border_style: z.enum(['square', 'rounded_square', 'circle', 'leaf', 'bars_horizontal', 'bars_vertical', 'star', 'diamond', 'cross', 'hexagon', 'heart', 'shield', 'crystal', 'flower', 'arrow', 'propuesta01']).optional(),
      eye_center_style: z.enum(['square', 'rounded_square', 'circle', 'squircle', 'dot', 'star', 'diamond', 'cross', 'plus']).optional(),
      data_pattern: z.enum(['square', 'square_small', 'dots', 'rounded', 'vertical', 'horizontal', 'diamond', 'circular', 'star', 'cross', 'random', 'wave', 'mosaic']).optional(),
      
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
      
      // Fixed size control (QR v3 optimization)
      fixed_size: z.enum(['small', 'medium', 'large', 'extra_large', 'auto']).optional(),
      
      // Eye colors (QR v3 optimization)
      eye_colors: z.object({
        outer: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
        inner: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
      }).optional(),
      
      // New enhanced eye color system
      eye_color_mode: z.enum(['inherit', 'solid', 'gradient']).optional(),
      eye_color_solid: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
      eye_color_gradient: z.object({
        type: z.enum(['linear', 'radial']).optional(),
        color1: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
        color2: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
        direction: z.enum(['top-bottom', 'left-right', 'diagonal', 'center-out']).optional(),
      }).optional(),
      
      // Border/frame color system
      eye_border_color_mode: z.enum(['inherit', 'solid', 'gradient']).optional(),
      eye_border_color_solid: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
      eye_border_color_gradient: z.object({
        type: z.enum(['linear', 'radial']).optional(),
        color1: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
        color2: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
        direction: z.enum(['top-bottom', 'left-right', 'diagonal', 'center-out']).optional(),
      }).optional(),
    })
    .optional(),
});

// Tipo inferido para usar en el formulario
export type GenerateFormData = z.infer<typeof generateFormSchema>;
