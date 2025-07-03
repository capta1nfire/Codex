import { z } from 'zod';

// Eye shapes from QR Engine v2
const eyeShapes = [
  'square',
  'rounded-square',
  'circle',
  'dot',
  'leaf',
  'bars-horizontal',
  'bars-vertical',
  'star',
  'diamond',
  'cross',
  'hexagon',
  'heart',
  'shield',
  'crystal',
  'flower',
  'arrow',
  'custom',
] as const;

// Data patterns from QR Engine v2
const dataPatterns = [
  'square',
  'dots',
  'rounded',
  'vertical',
  'horizontal',
  'diamond',
  'circular',
  'star',
  'cross',
  'random',
  'wave',
  'mosaic',
] as const;

// Frame styles
const frameStyles = ['simple', 'rounded', 'bubble', 'speech', 'badge'] as const;

// Visual effects
const visualEffects = ['shadow', 'glow', 'blur', 'noise', 'vintage'] as const;

// Gradient types
const gradientTypes = ['linear', 'radial', 'diagonal', 'conical'] as const;

// Color schema with HEX validation
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format');

// Gradient schema
const gradientSchema = z.object({
  type: z.enum(gradientTypes),
  colors: z.array(colorSchema).min(2).max(5),
  angle: z.number().min(0).max(360).optional(),
  centerX: z.number().min(0).max(100).optional(),
  centerY: z.number().min(0).max(100).optional(),
});

// Logo schema
const logoSchema = z.object({
  data: z.string(), // Base64 encoded image
  size: z.number().min(10).max(40).default(20), // Percentage of QR size
  padding: z.number().min(0).max(10).default(2),
  backgroundColor: colorSchema.optional(),
});

// Frame schema
const frameSchema = z.object({
  style: z.enum(frameStyles),
  color: colorSchema.optional(),
  width: z.number().min(1).max(20).optional(),
  text: z.string().max(50).optional(),
  textPosition: z.enum(['top', 'bottom']).optional(),
});

// Effect schema
const effectSchema = z.object({
  type: z.enum(visualEffects),
  intensity: z.number().min(0).max(100).default(50),
  color: colorSchema.optional(),
});

// Main QR options schema
const qrOptionsSchema = z
  .object({
    // Size and quality
    size: z.number().min(100).max(2000).default(300),
    margin: z.number().min(0).max(10).default(4),
    errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),

    // Basic customization
    eyeShape: z.enum(eyeShapes).optional(),
    dataPattern: z.enum(dataPatterns).optional(),

    // Colors
    foregroundColor: colorSchema.default('#000000'),
    eyeColor: colorSchema.optional(),

    // Advanced features
    gradient: gradientSchema.optional(),
    logo: logoSchema.optional(),
    frame: frameSchema.optional(),
    effects: z.array(effectSchema).max(3).optional(),

    // Performance options
    optimizeForSize: z.boolean().default(false),
    enableCache: z.boolean().default(true),
  })
  .strict();

// Main generation schema
export const qrGenerateSchema = z.object({
  data: z.string().min(1).max(4296), // QR code data limit
  options: qrOptionsSchema.optional(),
});

// Preview schema (for GET requests)
export const qrPreviewSchema = z.object({
  data: z.string().min(1).max(4296),
  eyeShape: z.enum(eyeShapes).optional(),
  dataPattern: z.enum(dataPatterns).optional(),
  fgColor: colorSchema.optional(),
  size: z.coerce.number().min(100).max(500).optional(),
});

// Batch schema
export const qrBatchSchema = z.object({
  codes: z.array(qrGenerateSchema).min(1).max(50),
  options: z
    .object({
      maxConcurrent: z.number().min(1).max(20).default(10),
      includeMetadata: z.boolean().default(true),
      stopOnError: z.boolean().default(false),
    })
    .optional(),
});

// Validation schema
export const qrValidateSchema = qrGenerateSchema;

// Export types
export type QRGenerateRequest = z.infer<typeof qrGenerateSchema>;
export type QROptions = z.infer<typeof qrOptionsSchema>;
export type QRBatchRequest = z.infer<typeof qrBatchSchema>;
