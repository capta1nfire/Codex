import { GenerateFormData } from '@/schemas/generate.schema';
import { getDefaultDataForType } from './barcodeTypes';

// IMPORTANT: These are FALLBACK values only!
// The actual default QR appearance should come from Studio Placeholder configuration.
// These values are used only when:
// 1. Studio placeholder config is not available
// 2. User is generating non-QR barcodes
// 3. As a safety fallback
export const defaultFormValues: GenerateFormData = {
  barcode_type: 'qrcode',
  data: getDefaultDataForType('qrcode'),
  options: {
    scale: 4,
    fgcolor: '#000000',
    height: 100,
    includetext: true,
    ecl: 'M',
    // ATTRACTIVE DEFAULTS - Showcase QReable's customization capabilities
    // These match Studio Placeholder factory defaults
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_color1: '#2563EB',  // CODEX Blue
    gradient_color2: '#000000',  // Black
    gradient_direction: 'center-out',
    gradient_angle: 90,
    gradient_borders: false,
    gradient_border_color: '#FFFFFF',
    gradient_border_width: 0.1,
    gradient_border_opacity: 0.3,
    gradient_apply_to_eyes: true,

    // QR v3 Eye & Pattern defaults - Modern circular style with dots
    eye_shape: undefined,
    data_pattern: 'dots',
    use_separated_eye_styles: true,
    eye_border_style: 'circle',
    eye_center_style: 'circle',
    
    // Eye color configuration
    eye_border_color_mode: 'inherit',
    eye_color_mode: 'inherit',
    
    // Frame defaults
    frame_enabled: false,
    frame_style: 'simple',
    frame_text: 'ESCANEA AQUÍ',
    frame_text_position: 'bottom',
    
    // Background defaults
    transparent_background: false,
  },
};