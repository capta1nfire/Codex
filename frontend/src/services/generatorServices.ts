/**
 * Generator Services
 * 
 * Isolated services for handling side effects in the generator state machine.
 * These services are pure functions that can be easily tested and mocked.
 */

import { GeneratorContext, ValidationMetadata } from '@/types/generatorStates';
import { SmartValidators } from '@/lib/smartValidation';

/**
 * URL Validation Service
 * Validates URLs and fetches metadata
 */
export async function urlValidationService(
  url: string,
  signal?: AbortSignal
): Promise<ValidationMetadata> {
  // First validate URL format
  const validation = SmartValidators.url(url);
  if (!validation.isValid) {
    return {
      exists: false,
      error: validation.error || 'URL no válida'
    };
  }

  try {
    // Call validation endpoint
    const response = await fetch('/api/validate/url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      exists: data.exists,
      title: data.metadata?.title,
      description: data.metadata?.description,
      image: data.metadata?.image,
      favicon: data.metadata?.favicon
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    
    return {
      exists: false,
      error: error.message || 'Error al validar URL'
    };
  }
}

/**
 * Barcode Generation Service
 * Generates QR codes and barcodes with the specified options
 */
export async function barcodeGenerationService(
  context: GeneratorContext,
  signal?: AbortSignal
): Promise<{ svgContent: string; enhancedData: any }> {
  const { barcodeType, formData, options } = context;
  
  // Prepare generation data based on barcode type
  let data = '';
  
  if (barcodeType === 'qrcode') {
    // For QR codes, use the appropriate field based on QR type
    switch (context.qrType) {
      case 'link':
        data = formData.url || '';
        break;
      case 'text':
        data = formData.text || '';
        break;
      case 'email':
        data = `mailto:${formData.email || ''}?subject=${formData.subject || ''}&body=${formData.body || ''}`;
        break;
      case 'phone':
        data = `tel:${formData.phone || ''}`;
        break;
      case 'sms':
        data = `smsto:${formData.phone || ''}:${formData.message || ''}`;
        break;
      case 'wifi':
        data = `WIFI:T:${formData.encryption || 'WPA'};S:${formData.ssid || ''};P:${formData.password || ''};H:${formData.hidden ? 'true' : 'false'};`;
        break;
      case 'vcard':
        data = generateVCardData(formData);
        break;
      default:
        data = formData.text || '';
    }
  } else {
    // For other barcode types, use the data field directly
    data = formData.data || formData.text || '';
  }

  // Validate data
  if (!data) {
    throw new Error('No hay datos para generar');
  }

  try {
    // REGLA: V1 SOLO para códigos de barras, V3 ÚNICAMENTE para QR
    const endpoint = barcodeType === 'qrcode' ? '/api/v3/qr/enhanced' : '/api/v1/barcode';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        barcodeType === 'qrcode' ? {
          // V3 API format para QR codes
          data,
          options: {
            size: options.size || 300,
            eyeShape: options.eyeShape || 'rounded',
            dataShape: options.dataShape || 'square',
            fill: options.fgcolor || options.fgColor || '#000000',
            gradient: options.gradient_enabled ? {
              enabled: true,
              gradient_type: options.gradient_type || 'radial',
              colors: options.gradient_colors || ['#000000', '#666666'],
              angle: options.gradient_direction || 0,
              apply_to_eyes: false,
              apply_to_data: true,
              stroke_style: {
                enabled: false
              }
            } : undefined
          }
        } : {
          // V1 API format para códigos de barras
          barcode_type: barcodeType,
          data,
          options
        }
      ),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (barcodeType === 'qrcode') {
      // V3 API devuelve paths - construir SVG completo
      const svgContent = buildSVGFromV3Paths(result.data, options);
      return {
        svgContent,
        enhancedData: result.data || result.metadata || null
      };
    } else {
      // V1 API devuelve SVG completo para códigos de barras
      return {
        svgContent: result.svgString || result.svg || result.data || '',
        enhancedData: result.enhancedData || result.metadata || null
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    
    throw new Error(error.message || 'Error al generar código');
  }
}

/**
 * Construir SVG completo desde la respuesta de QR v3 API
 */
function buildSVGFromV3Paths(v3Data: any, options: any): string {
  if (!v3Data || !v3Data.path_data) {
    throw new Error('Invalid V3 API response: missing path_data');
  }

  const size = options.size || 300;
  const dataModules = v3Data.data_modules || 21;
  const quietZone = v3Data.metadata?.quiet_zone || 4;
  const totalSize = dataModules + (quietZone * 2);
  
  // Colores
  const fgColor = options.fgcolor || options.fgColor || '#000000';
  
  // Construir SVG completo usando el path_data de V3 - sin fondo
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <g transform="translate(${quietZone}, ${quietZone})">
      <path d="${v3Data.path_data}" fill="${fgColor}"/>
    </g>
  </svg>`;
  
  return svg;
}

/**
 * Generate vCard data from form fields
 */
function generateVCardData(formData: Record<string, any>): string {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${formData.firstName || ''} ${formData.lastName || ''}`,
    `N:${formData.lastName || ''};${formData.firstName || ''};;;`,
    formData.organization ? `ORG:${formData.organization}` : '',
    formData.phone ? `TEL:${formData.phone}` : '',
    formData.email ? `EMAIL:${formData.email}` : '',
    formData.website ? `URL:${formData.website}` : '',
    formData.address ? `ADR:;;${formData.address};;;;` : '',
    'END:VCARD'
  ].filter(line => line).join('\n');
  
  return vcard;
}

/**
 * Auto-generation Decision Service
 * Determines if auto-generation should occur based on context
 */
export function shouldAutoGenerate(context: GeneratorContext): boolean {
  // Don't auto-generate if user hasn't started typing
  if (!context.hasUserStartedTyping) return false;
  
  // Don't auto-generate if currently typing
  if (context.isTyping) return false;
  
  // Don't auto-generate if data hasn't changed
  const currentData = JSON.stringify(context.formData);
  if (currentData === context.lastGeneratedData) return false;
  
  // Check if we have valid data for the current type
  if (context.barcodeType === 'qrcode') {
    switch (context.qrType) {
      case 'link':
        const url = context.formData.url || '';
        return url.length > 0 && SmartValidators.url(url).isValid;
      case 'text':
        return (context.formData.text || '').length > 0;
      case 'email':
        return (context.formData.email || '').length > 0;
      case 'phone':
        return (context.formData.phone || '').length > 0;
      case 'wifi':
        return (context.formData.ssid || '').length > 0;
      default:
        return true;
    }
  } else {
    // For other barcode types, check if data meets requirements
    const data = context.formData.data || context.formData.text || '';
    return data.length > 0;
  }
}

/**
 * Initial Generation Service
 * Generates the initial QR code when the page loads
 */
export async function generateInitialCode(
  signal?: AbortSignal
): Promise<{ svgContent: string; enhancedData: any }> {
  const initialContext: GeneratorContext = {
    barcodeType: 'qrcode',
    qrType: 'link',
    formData: {
      url: 'https://tu-sitio-web.com'
    },
    options: {
      size: 300,
      scale: 2,
      margin: 4,
      errorCorrectionLevel: 'M',
      fgColor: '#000000',
      gradient_enabled: true,
      gradient_type: 'radial',
      gradient_colors: ['#000000', '#666666'],
      eyeShape: 'rounded',
      dataShape: 'square'
    },
    lastValidatedUrl: '',
    validationMetadata: null,
    isUrlValid: false,
    svgContent: null,
    enhancedData: null,
    scannabilityAnalysis: null,
    lastGeneratedData: '',
    hasGeneratedInitial: false,
    isTyping: false,
    hasUserStartedTyping: false,
    shouldAutoGenerate: true,
    isUserEditing: false,
    dynamicDebounceTime: 300
  };

  return barcodeGenerationService(initialContext, signal);
}