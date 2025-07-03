/**
 * QR Code Type Definitions
 *
 * Shared types for QR v3 generation and validation
 */

export interface QrCustomization {
  // Legacy eye shape (backward compatibility)
  eye_shape?: string;

  // Modern separated eye styles
  eye_border_style?: string;
  eye_center_style?: string;

  // Data pattern
  data_pattern?: string;

  // Colors
  colors?: {
    foreground?: string;
    background?: string;
  };

  // Gradient options
  gradient?: {
    enabled?: boolean;
    gradient_type?: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors?: string[];
    angle?: number;
    apply_to_eyes?: boolean;
    apply_to_data?: boolean;
    stroke_style?: {
      enabled?: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
  };

  // Effects
  effects?: Array<{
    type: 'shadow' | 'glow' | 'blur' | 'noise' | 'vintage';
    intensity?: number;
    color?: string;
  }>;

  // Logo
  logo?: {
    data: string;
    size_percentage: number;
    padding?: number;
    background?: string;
    shape?: 'square' | 'circle' | 'rounded_square';
  };

  // Logo size ratio (simplified access)
  logo_size_ratio?: number;

  // Frame with enhanced CTA options
  frame?: {
    frame_type: 'simple' | 'rounded' | 'decorated' | 'bubble' | 'speech' | 'badge';
    text?: string; // Fully editable CTA text
    text_size?: number; // Font size in pixels (10-20)
    text_font?: string; // Font family
    color: string; // Text color
    background_color?: string; // Frame background color
    text_position: 'top' | 'bottom' | 'left' | 'right';
    padding?: number; // Internal padding (5-20)
    border_width?: number; // Border thickness (1-5)
    corner_radius?: number; // For rounded frame type (0-20)
  };

  // Error correction level
  error_correction?: 'L' | 'M' | 'Q' | 'H';
}

export interface QrGenerationOptions {
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  customization?: QrCustomization;
}

export interface QrV3Request {
  data: string;
  options?: QrGenerationOptions;
}
