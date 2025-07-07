/**
 * QR Default Configuration Constants
 * 
 * Valores por defecto para configuraciones de QR Studio
 */

export const DEFAULT_QR_CONFIG = {
  eye_shape: 'square',
  data_pattern: 'square',
  colors: {
    foreground: '#000000',
    background: '#FFFFFF',
  },
  gradient: {
    enabled: false,
    gradient_type: 'linear',
    colors: ['#000000', '#333333'],
    angle: 90,
    apply_to_eyes: false,
    apply_to_data: true,
    stroke_style: {
      enabled: false,
      color: '#FFFFFF',
      width: 0.5,
      opacity: 0.3,
    },
  },
  effects: [],
  error_correction: 'M',
  logo: {
    enabled: false,
    size_percentage: 20,
    padding: 10,
    shape: 'square',
  },
  frame: {
    enabled: false,
    style: 'simple',
    color: '#000000',
  },
};