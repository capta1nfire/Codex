/**
 * Tipos para el generador de QR v3
 * 
 * @principle Pilar 1: Seguridad - Tipos estrictos y validados
 * @principle Pilar 2: Robustez - Interfaces completas
 * @principle Pilar 3: Simplicidad - Estructura clara
 * @principle Pilar 4: Modularidad - Tipos reutilizables
 * @principle Pilar 5: Valor - Compatibilidad con backend
 */

export interface QRV3Customization {
  gradient?: {
    enabled: boolean;
    gradient_type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
    apply_to_eyes?: boolean;
    apply_to_data?: boolean;
    per_module?: boolean;
    stroke_style?: {
      enabled: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
  };
  eye_shape?: string;
  eye_border_style?: string;
  eye_center_style?: string;
  eye_color_mode?: 'inherit' | 'custom';
  eye_border_color_mode?: 'inherit' | 'custom';
  eye_color_solid?: string;
  eye_border_color_solid?: string;
  eye_border_width?: number;
  eye_border_opacity?: number;
  eye_border_gradient?: {
    enabled: boolean;
    gradient_type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
  };
  eye_center_gradient?: {
    enabled: boolean;
    gradient_type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
  };
  data_pattern?: string;
  colors?: {
    foreground: string;
    background: string;
  };
  logo?: {
    data: string;
    size_percentage: number;
    padding: number;
    shape: 'square' | 'circle' | 'rounded_square';
  };
  frame?: {
    frame_type: 'simple' | 'rounded' | 'decorated' | 'bubble' | 'speech' | 'badge';
    text?: string;
    text_size?: number;
    text_font?: string;
    color: string;
    background_color?: string;
    text_position: 'top' | 'bottom' | 'left' | 'right';
    padding?: number;
    border_width?: number;
    corner_radius?: number;
  };
  effects?: Array<{
    effect_type: 'shadow' | 'glow' | 'blur' | 'noise' | 'vintage';
    config?: Record<string, any>;
  }>;
}

export interface QRV3Options {
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  customization?: QRV3Customization;
}