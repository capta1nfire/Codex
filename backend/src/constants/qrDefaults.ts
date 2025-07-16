/**
 * QR Default Configuration Constants
 *
 * Valores por defecto para configuraciones de QR Studio
 */

export const DEFAULT_QR_CONFIG = {
  use_separated_eye_styles: true,  // ✅ TRUE para match con página principal
  // Cuando use_separated_eye_styles es true, necesitamos ambos estilos
  eye_border_style: 'circle',  // ✅ Anillo exterior circular
  eye_center_style: 'circle',  // ✅ Centro circular
  data_pattern: 'dots',  // ✅ DOTS para match con página principal
  colors: {
    foreground: '#000000',
    background: '#FFFFFF',
  },
  gradient: {
    enabled: true,  // Changed to match page.tsx default
    gradient_type: 'radial',  // Changed to match page.tsx default
    colors: ['#2563EB', '#000000'],  // ✅ AZUL CODEX + NEGRO como página principal
    angle: 90,
    apply_to_eyes: true,  // ✅ TRUE para que los ojos hereden el gradiente
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
  // MARCO TEMPORALMENTE DESHABILITADO en el frontend (useQRGenerationState.ts)
  // para sincronizar con la página principal que no muestra marco
  frame: {
    enabled: false,  // Ya está deshabilitado aquí también
    style: 'simple',
    color: '#000000',
  },
};
