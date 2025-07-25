/**
 * QR Studio Types
 * 
 * Tipos TypeScript para la configuración de QR Studio
 * Diseñado para ser extensible a usuarios Premium en el futuro
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export enum StudioConfigType {
  PLACEHOLDER = 'PLACEHOLDER',
  TEMPLATE = 'TEMPLATE',
  GLOBAL = 'GLOBAL',
}

export enum TemplateType {
  // Tipos básicos
  URL = 'url',
  WIFI = 'wifi',
  VCARD = 'vcard',
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
  LOCATION = 'location',
  EVENT = 'event',
  CRYPTO = 'crypto',
  
  // Redes sociales
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  WHATSAPP = 'whatsapp',
  SPOTIFY = 'spotify',
  GITHUB = 'github',
  PINTEREST = 'pinterest',
  SNAPCHAT = 'snapchat',
}

// ==================== SCHEMAS ====================

// Schema para colores de ojos
export const EyeColorsSchema = z.object({
  outer: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  inner: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Schema para configuración de colores
export const ColorConfigSchema = z.object({
  foreground: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  eye_colors: EyeColorsSchema.optional(),
});

// Schema para configuración de gradiente
export const GradientConfigSchema = z.object({
  enabled: z.boolean(),
  gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']),
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(5),
  angle: z.number().min(0).max(360).optional(),
  apply_to_eyes: z.boolean(),
  apply_to_data: z.boolean(),
  per_module: z.boolean().optional(),
  stroke_style: z.object({
    enabled: z.boolean(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    width: z.number().min(0.1).max(3.0).optional(), // UI limitado a 0.20, backend validation requires min 0.1
    opacity: z.number().min(0.1).max(1.0).optional(), // Backend requires minimum 0.1 (10%)
  }).optional(),
});

// Schema para configuración de QR
export const QRConfigSchema = z.object({
  // Estilos de ojos - siempre se usan eye_border_style y eye_center_style
  // En modo unificado ambos tienen el mismo valor
  use_separated_eye_styles: z.boolean().optional(),
  eye_border_style: z.enum([
    'square', 'rounded_square', 'circle', 'quarter_round', 'cut_corner',
    'thick_border', 'double_border', 'diamond', 'hexagon', 'cross',
    'star', 'leaf', 'arrow', 'teardrop', 'wave', 'petal',
    'crystal', 'flame', 'organic'
  ]).optional(),
  eye_center_style: z.enum([
    'square', 'rounded_square', 'circle', 'squircle', 'dot', 'star', 
    'diamond', 'cross', 'plus'
  ]).optional(),
  
  data_pattern: z.enum([
    'square', 'square_small', 'dots', 'rounded', 'squircle', 'vertical',
    'horizontal', 'diamond', 'circular', 'star', 'cross', 'random',
    'wave', 'mosaic'
  ]).optional(),
  
  // Colores
  colors: ColorConfigSchema.optional(),
  
  // Gradiente
  gradient: GradientConfigSchema.optional(),
  
  // Efectos
  effects: z.array(z.object({
    type: z.enum(['shadow', 'glow', 'blur', 'noise', 'vintage']),
    intensity: z.number().min(0).max(100).optional(),
  })).optional(),
  
  // Nivel de corrección de errores
  error_correction: z.enum(['L', 'M', 'Q', 'H']).optional(),
  
  // Configuración de logo (para plantillas)
  logo: z.object({
    enabled: z.boolean(),
    data: z.string().optional(), // Base64 image data
    size_percentage: z.number().min(10).max(30),
    padding: z.number().min(0).max(20),
    shape: z.enum(['square', 'circle', 'rounded_square']),
  }).optional(),
  
  // Frame (para plantillas)
  frame: z.object({
    enabled: z.boolean(),
    style: z.enum(['simple', 'rounded', 'bubble', 'speech', 'badge']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  
  // Fondo transparente
  transparent_background: z.boolean().optional(),
  
  // Nuevos campos para colores separados de ojos
  eye_border_color_mode: z.enum(['inherit', 'custom']).optional(),
  eye_center_color_mode: z.enum(['inherit', 'custom']).optional(),
  
  eye_border_colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  
  eye_border_width: z.number().min(0.1).max(5.0).optional(),
  eye_border_opacity: z.number().min(0.1).max(1.0).optional(), // Backend requires minimum 0.1 (10%)
  
  eye_center_colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  
  eye_border_gradient: z.object({
    enabled: z.boolean(),
    gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(5),
    angle: z.number().min(0).max(360).optional(),
  }).optional(),
  
  eye_center_gradient: z.object({
    enabled: z.boolean(),
    gradient_type: z.enum(['linear', 'radial', 'conic', 'diamond', 'spiral']),
    colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(2).max(5),
    angle: z.number().min(0).max(360).optional(),
  }).optional(),
  
});

// Schema para configuración de Studio
export const StudioConfigSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(StudioConfigType),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  templateType: z.nativeEnum(TemplateType).nullable().optional(),
  config: QRConfigSchema,
  isActive: z.boolean(),
  createdById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive(),
});

// Schema para preset (futuro uso Premium)
export const PresetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  config: QRConfigSchema,
  isPublic: z.boolean(), // camelCase
  ownerId: z.string().uuid(), // camelCase
  createdAt: z.string().datetime(), // camelCase
  usageCount: z.number().int().nonnegative(), // camelCase
});

// ==================== TYPES ====================

export type EyeColors = z.infer<typeof EyeColorsSchema>;
export type ColorConfig = z.infer<typeof ColorConfigSchema>;
export type GradientConfig = z.infer<typeof GradientConfigSchema>;
export type QRConfig = z.infer<typeof QRConfigSchema>;
export type StudioConfig = z.infer<typeof StudioConfigSchema>;
export type Preset = z.infer<typeof PresetSchema>;

// ==================== INTERFACES ====================

// Interface para el estado del Studio
export interface StudioState {
  configs: StudioConfig[];
  activeConfig: StudioConfig | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

// Interface para acciones del Studio
export interface StudioActions {
  loadConfigs: () => Promise<void>;
  saveConfig: (config: Partial<StudioConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  setActiveConfig: (config: StudioConfig) => void;
  resetToDefaults: () => Promise<void>;
  applyToAll: (config: QRConfig) => Promise<void>;
  markAsDirty: () => void;
}

// Interface para el contexto del Studio
export interface StudioContextValue extends StudioState, StudioActions {
  // Helpers
  getConfigByType: (type: StudioConfigType, templateType?: TemplateType) => StudioConfig | undefined;
  getPlaceholderConfig: () => QRConfig;
  getTemplateConfig: (template: TemplateType) => QRConfig;
  canEdit: boolean;
  canDelete: boolean;
}

// ==================== DEFAULT VALUES ====================

export const DEFAULT_COLORS: ColorConfig = {
  foreground: '#000000',
  background: '#FFFFFF',
};

export const DEFAULT_GRADIENT: GradientConfig = {
  enabled: true,  // Changed to match page.tsx default
  gradient_type: 'radial',  // Changed to match page.tsx default
  colors: ['#2563EB', '#000000'],  // ✅ CAMBIAR A AZUL CODEX + NEGRO como página principal
  angle: 90,
  apply_to_eyes: true,  // ✅ CAMBIAR A TRUE para que los ojos hereden el gradiente
  apply_to_data: true,
  stroke_style: {
    enabled: false,
    color: '#FFFFFF',
    width: 0.5,
    opacity: 0.3, // Mínimo 0.1 requerido por backend
  },
};

export const DEFAULT_QR_CONFIG: QRConfig = {
  use_separated_eye_styles: true,  // ✅ CAMBIAR A TRUE para match con página principal
  // When using separated styles, we need both border and center styles
  eye_border_style: 'circle',  // ✅ Anillo exterior circular como en página principal
  eye_center_style: 'circle',  // ✅ Centro circular como en página principal
  data_pattern: 'dots',  // ✅ CAMBIAR A DOTS para match con página principal
  colors: DEFAULT_COLORS,
  gradient: DEFAULT_GRADIENT,
  effects: [],
  error_correction: 'M',
  // NOTA: El marco está temporalmente deshabilitado en useQRGenerationState.ts
  // para sincronizar con la página principal que no muestra marco
  
  // Nuevos campos para colores de ojos - por defecto heredan del patrón principal
  eye_border_color_mode: 'inherit',
  eye_center_color_mode: 'inherit',
  eye_border_colors: {
    primary: '#000000',
    secondary: '#666666',
  },
  eye_center_colors: {
    primary: '#000000',
    secondary: '#666666',
  },
  eye_border_gradient: {
    enabled: false,
    gradient_type: 'radial',
    colors: ['#000000', '#666666'],
  },
  eye_center_gradient: {
    enabled: false,
    gradient_type: 'radial',
    colors: ['#000000', '#666666'],
  },
};

// ==================== VALIDATION HELPERS ====================

export const validateStudioConfig = (data: unknown): StudioConfig => {
  return StudioConfigSchema.parse(data);
};

export const validateQRConfig = (data: unknown): QRConfig => {
  return QRConfigSchema.parse(data);
};

// ==================== TYPE GUARDS ====================

export const isStudioConfig = (data: unknown): data is StudioConfig => {
  try {
    StudioConfigSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

export const isTemplateType = (value: string): value is TemplateType => {
  return Object.values(TemplateType).includes(value as TemplateType);
};