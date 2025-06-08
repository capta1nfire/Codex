import { GenerateFormData } from '@/schemas/generate.schema';
import { getDefaultDataForType } from './barcodeTypes';

// Definir los valores por defecto fuera del componente - SVG siempre transparente
export const defaultFormValues: GenerateFormData = {
  barcode_type: 'qrcode',
  data: getDefaultDataForType('qrcode'),
  options: {
    scale: 2,
    fgcolor: '#000000',
    bgcolor: undefined, // undefined para SVG transparente que permita gradientes
    height: 100,
    includetext: true,
    ecl: 'M',
    // ✨ CODEX Hero Gradient - Azul corporativo con negro, radial desde centro
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_color1: '#2563EB', // CODEX Corporate Blue en el centro
    gradient_color2: '#000000', // Negro en los costados para máximo contraste
    gradient_direction: 'top-bottom', // No se usa en radial pero mantenemos por consistencia
  },
};