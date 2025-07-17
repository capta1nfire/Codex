/**
 * Studio Validation Schemas
 * 
 * Esquemas de validación para QR Studio siguiendo los 5 pilares.
 * 
 * @principle Pilar 1: Seguridad - Validación estricta de inputs
 * @principle Pilar 2: Robustez - Manejo completo de casos edge
 * @principle Pilar 3: Simplicidad - Esquemas claros y reutilizables
 * @principle Pilar 4: Modularidad - Validaciones componibles
 * @principle Pilar 5: Valor - Protección contra configuraciones inválidas
 */

import { z } from 'zod';

// Validación de color hexadecimal
const hexColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido (ej: #FF0000)')
  .transform(val => val.toUpperCase());

// Validación de nivel de corrección de errores
const errorCorrectionSchema = z.enum(['L', 'M', 'Q', 'H'], {
  errorMap: () => ({ message: 'Nivel de corrección inválido' })
});

// Validación de formas de ojos (modo unificado)
const eyeShapeSchema = z.enum([
  'square',
  'rounded_square',
  'circle',
  'dot',
  'leaf',
  'star',
  'diamond',
  'heart',
  'shield',
  'hexagon'
], {
  errorMap: () => ({ message: 'Forma de ojo inválida' })
});

// Validación de estilos de borde de ojo (modo separado)
const eyeBorderStyleSchema = z.enum([
  'square', 'rounded_square', 'circle', 'quarter_round', 'cut_corner',
  'thick_border', 'double_border', 'diamond', 'hexagon', 'cross',
  'star', 'leaf', 'arrow', 'teardrop', 'wave', 'petal',
  'crystal', 'flame', 'organic'
], {
  errorMap: () => ({ message: 'Estilo de borde de ojo inválido' })
});

// Validación de estilos de centro de ojo (modo separado)
const eyeCenterStyleSchema = z.enum([
  'square', 'rounded_square', 'circle', 'dot', 'star', 
  'diamond', 'cross', 'plus'
], {
  errorMap: () => ({ message: 'Estilo de centro de ojo inválido' })
});

// Validación de patrones de datos
const dataPatternSchema = z.enum([
  'square',
  'dots',
  'rounded',
  'circular',
  'star',
  'cross',
  'wave',
  'mosaic'
], {
  errorMap: () => ({ message: 'Patrón de datos inválido' })
});

// Validación de tipos de gradiente
const gradientTypeSchema = z.enum([
  'linear',
  'radial',
  'conic',
  'diamond',
  'spiral'
], {
  errorMap: () => ({ message: 'Tipo de gradiente inválido' })
});

// Validación de tipos de efectos
const effectTypeSchema = z.enum([
  'shadow',
  'glow',
  'blur',
  'noise',
  'vintage'
], {
  errorMap: () => ({ message: 'Tipo de efecto inválido' })
});

// Esquema de colores de ojos
const eyeColorsSchema = z.object({
  outer: hexColorSchema.optional(),
  inner: hexColorSchema.optional(),
}).optional();

// Esquema de colores
const colorsSchema = z.object({
  foreground: hexColorSchema.optional(),
  background: hexColorSchema.optional(),
  eye_colors: eyeColorsSchema,
}).refine(data => {
  // Solo validar si ambos colores están presentes
  if (data.foreground && data.background) {
    return data.foreground !== data.background;
  }
  return true;
}, {
  message: 'Los colores de primer plano y fondo deben ser diferentes',
  path: ['background'],
});

// Esquema de gradiente
const gradientSchema = z.object({
  enabled: z.boolean(),
  gradient_type: gradientTypeSchema,
  colors: z.array(hexColorSchema)
    .min(2, 'El gradiente requiere al menos 2 colores')
    .max(5, 'El gradiente admite máximo 5 colores'),
  angle: z.number()
    .min(0, 'El ángulo debe ser entre 0 y 360')
    .max(360, 'El ángulo debe ser entre 0 y 360')
    .optional(),
  apply_to_eyes: z.boolean().optional(),
  apply_to_data: z.boolean().optional(),
  per_module: z.boolean().optional(),
  stroke_style: z.object({
    enabled: z.boolean(),
    color: hexColorSchema.optional(),
    width: z.number().min(0.1).max(2.0).optional(),
    opacity: z.number().min(0.1).max(1.0).optional(),
  }).optional(),
}).optional();

// Esquema de efectos
const effectSchema = z.object({
  type: effectTypeSchema,
  intensity: z.number()
    .min(0, 'La intensidad debe ser entre 0 y 100')
    .max(100, 'La intensidad debe ser entre 0 y 100'),
});

// Esquema principal de configuración QR
export const qrConfigSchema = z.object({
  // Soporte para estilos de ojos separados o unificados
  use_separated_eye_styles: z.boolean().optional(),
  eye_shape: eyeShapeSchema.optional(), // Opcional porque puede usar estilos separados
  eye_border_style: eyeBorderStyleSchema.optional(),
  eye_center_style: eyeCenterStyleSchema.optional(),
  
  data_pattern: dataPatternSchema.optional(),
  colors: colorsSchema.optional(),
  error_correction: errorCorrectionSchema.optional(),
  gradient: gradientSchema,
  effects: z.array(effectSchema).optional(),
  transparent_background: z.boolean().optional(),
  
  // Campos adicionales opcionales
  logo: z.object({
    enabled: z.boolean(),
    size_percentage: z.number().min(10).max(30).optional(),
    padding: z.number().min(0).max(20).optional(),
    shape: z.enum(['square', 'circle', 'rounded_square']).optional(),
  }).optional(),
  
  frame: z.object({
    enabled: z.boolean(),
    style: z.enum(['simple', 'rounded', 'bubble', 'speech', 'badge']).optional(),
    color: hexColorSchema.optional(),
  }).optional(),
});

// Esquema para configuración de Studio
export const studioConfigSchema = z.object({
  type: z.enum(['PLACEHOLDER', 'TEMPLATE', 'GLOBAL']),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  config: qrConfigSchema,
  templateType: z.string().optional(),
});

// Validador de configuración QR con mensajes detallados
export function validateQRConfig(config: unknown): {
  isValid: boolean;
  errors?: Record<string, string>;
  data?: z.infer<typeof qrConfigSchema>;
} {
  try {
    const result = qrConfigSchema.parse(config);
    return { isValid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Configuración inválida' } };
  }
}

// Validador de contraste entre colores
export function validateColorContrast(
  foreground: string,
  background: string
): { isValid: boolean; message?: string } {
  // Convertir hex a RGB
  const getRGB = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  // Calcular luminancia relativa
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fgRGB = getRGB(foreground);
  const bgRGB = getRGB(background);
  
  const fgLum = getLuminance(fgRGB);
  const bgLum = getLuminance(bgRGB);
  
  const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  // Requerir contraste mínimo de 3:1 para QR codes
  if (contrast < 3) {
    return {
      isValid: false,
      message: `Contraste insuficiente (${contrast.toFixed(1)}:1). Se requiere mínimo 3:1 para buena legibilidad.`
    };
  }
  
  return { isValid: true };
}

// Tipos exportados
export type QRConfig = z.infer<typeof qrConfigSchema>;
export type StudioConfig = z.infer<typeof studioConfigSchema>;
export type GradientType = z.infer<typeof gradientTypeSchema>;
export type EffectType = z.infer<typeof effectTypeSchema>;
export type EyeShape = z.infer<typeof eyeShapeSchema>;
export type DataPattern = z.infer<typeof dataPatternSchema>;