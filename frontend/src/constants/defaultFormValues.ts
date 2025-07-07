import { GenerateFormData } from '@/schemas/generate.schema';
import { getDefaultDataForType } from './barcodeTypes';

// Definir los valores por defecto fuera del componente - SVG siempre transparente
export const defaultFormValues: GenerateFormData = {
  barcode_type: 'qrcode',
  data: getDefaultDataForType('qrcode'),
  options: {
    scale: 4,
    fgcolor: '#000000',
    height: 100,
    includetext: true,
    ecl: 'M',
    // ✨ CODEX Hero Gradient - Azul corporativo con negro, radial desde centro
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_color1: '#2563EB', // CODEX Corporate Blue en el centro
    gradient_color2: '#000000', // Negro en los costados para máximo contraste
    gradient_direction: 'top-bottom', // No se usa en radial pero mantenemos por consistencia
    gradient_borders: false, // White semi-transparent borders for gradient modules (disabled by default)
    
    // QR v3 Eye & Pattern defaults - Circle style
    eye_shape: undefined, // No usar modo unificado
    data_pattern: 'dots', // Default data pattern - círculos (dots)
    use_separated_eye_styles: true, // ✅ USAR ESTILOS SEPARADOS para anillos concéntricos
    eye_border_style: 'circle', // ✅ Anillo exterior circular
    eye_center_style: 'circle', // ✅ Centro circular
    
    // Frame defaults
    frame_enabled: false, // Disable frame temporarily
    frame_style: 'simple', // Default frame style
    frame_text: 'ESCANEA AQUÍ', // Default frame text
    frame_text_position: 'bottom', // Default frame text position
    
    // Background defaults
    transparent_background: false, // Default to white background
  },
};