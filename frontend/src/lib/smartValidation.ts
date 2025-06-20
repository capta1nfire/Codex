/**
 * Smart Validation System for Automatic Barcode Generation
 * 
 * This module provides intelligent validation for different barcode types
 * to prevent unnecessary API calls and improve user experience.
 * 
 * @module smartValidation
 * @since 2025-01-16
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  minRequiredLength?: number;
}

export interface QRFormData {
  [key: string]: any;
}

/**
 * Validation rules for each barcode/QR type
 * Each validator returns a ValidationResult indicating if the data is complete enough to generate
 */
export const SmartValidators = {
  // ============ QR Code Content Types ============
  
  /** URL validation - must be a valid URL format */
  url: (data: any): ValidationResult => {
    if (!data.url || data.url.trim().length === 0 || data.url === 'https://tu-sitio-web.com') {
      return { isValid: false, message: 'Ingresa o pega el enlace de tu sitio web' };
    }
    
    const url = data.url.trim();
    
    // Progressive validation based on what user has typed
    if (url.length === 1) {
      return { isValid: false, message: '' }; // Too early, no message
    }
    
    // Just started typing
    if (url.length < 4) {
      if (url === 'w' || url === 'ww') {
        return { isValid: false, message: '' }; // Still typing www
      }
      return { isValid: false, message: 'Continúa escribiendo...' };
    }
    
    // Don't validate single words being deleted (like "appl", "app", "ap", "a")
    if (!url.includes('.') && !url.includes('://') && url.length < 6) {
      return { isValid: false, message: '' }; // No message for partial words
    }
    
    // Check for incomplete patterns with helpful messages
    if (url === 'www') {
      return { isValid: false, message: 'Añade un punto después de www' };
    }
    
    if (url === 'www.') {
      return { isValid: false, message: 'Completa el dominio' };
    }
    
    if (url.startsWith('www.') && url.length < 8) {
      const afterWww = url.substring(4);
      if (afterWww.length < 3) {
        return { isValid: false, message: 'Completa el nombre del dominio' };
      }
    }
    
    if (url === 'http://' || url === 'https://') {
      return { isValid: false, message: 'Añade el dominio después de ://' };
    }
    
    if (url.startsWith('http://') && url.length === 8) {
      return { isValid: false, message: 'Completa el dominio' };
    }
    
    if (url.startsWith('https://') && url.length === 9) {
      return { isValid: false, message: 'Completa el dominio' };
    }
    
    // Check if it ends with just a dot (incomplete domain)
    if (url.endsWith('.') && !url.endsWith('..')) {
      const parts = url.split('.');
      if (parts.length === 2 && parts[1] === '') {
        return { isValid: false, message: 'Añade la extensión (.com, .org, etc.)' };
      }
      return { isValid: false, message: 'Completa el dominio' };
    }
    
    // Check if user is in the middle of typing an extension
    // Only consider it "typing" if it's a single character after the dot
    const typingExtensionPattern = /^(https?:\/\/)?(www\.)?([\w-]+\.)+[\w]{1}$/i;
    if (typingExtensionPattern.test(url)) {
      // User is typing an extension (only 1 character), don't show error yet
      return { isValid: false, message: '' };
    }
    
    // Check for domain without extension
    const domainWithoutExtPattern = /^(https?:\/\/)?(www\.)?[\w-]+$/i;
    if (domainWithoutExtPattern.test(url)) {
      return { isValid: false, message: 'Añade .com, .org, .net, etc.' };
    }
    
    // Basic URL pattern check - más flexible
    // Acepta: google.com, www.google.com, https://google.com, capta.co, etc.
    // Permite extensiones de 2 o más caracteres (.co, .com, .org, etc.)
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)*[\w-]+\.[\w-]{2,}(\/.*)?$/i;
    
    if (!urlPattern.test(url)) {
      // Check for common typing patterns before showing error
      const partialDomainPattern = /^(https?:\/\/)?(www\.)?([\w-]+\.)+$/i;
      if (partialDomainPattern.test(url)) {
        // User just typed a dot, waiting for extension
        return { isValid: false, message: 'Completa la extensión del dominio' };
      }
      
      if (url.includes('..')) {
        return { isValid: false, message: 'URL inválida (doble punto)' };
      }
      if (url.includes(' ')) {
        return { isValid: false, message: 'Ingresa o pega el enlace de tu sitio web' };
      }
      
      // Don't show "invalid format" for short partial domains
      if (url.length < 6) {
        return { isValid: false, message: '' };
      }
      
      return { isValid: false, message: 'Formato de URL inválido' };
    }
    
    return { isValid: true };
  },

  /** WhatsApp validation - phone number must be complete */
  whatsapp: (data: any): ValidationResult => {
    if (!data.phoneNumber) {
      return { isValid: false, message: 'Ingresa un número' };
    }
    
    const cleaned = data.phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/10 dígitos`,
        minRequiredLength: 10 
      };
    }
    
    return { isValid: true };
  },

  /** Email validation - must be valid email format */
  email: (data: any): ValidationResult => {
    if (!data.email || data.email.trim().length === 0) {
      return { isValid: false, message: 'Ingresa un email' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { isValid: false, message: 'Email inválido' };
    }
    
    return { isValid: true };
  },

  /** SMS validation - phone number required */
  sms: (data: any): ValidationResult => {
    if (!data.phoneNumber) {
      return { isValid: false, message: 'Ingresa un número' };
    }
    
    const cleaned = data.phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 7) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/7 dígitos mínimo`,
        minRequiredLength: 7 
      };
    }
    
    return { isValid: true };
  },

  /** Phone validation - similar to SMS */
  phone: (data: any): ValidationResult => {
    return SmartValidators.sms(data);
  },

  /** WiFi validation - SSID is required */
  wifi: (data: any): ValidationResult => {
    if (!data.ssid || data.ssid.trim().length < 2) {
      return { isValid: false, message: 'SSID muy corto' };
    }
    
    return { isValid: true };
  },

  /** Location validation - coordinates required */
  location: (data: any): ValidationResult => {
    if (!data.latitude || !data.longitude) {
      return { isValid: false, message: 'Coordenadas incompletas' };
    }
    
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return { isValid: false, message: 'Coordenadas inválidas' };
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { isValid: false, message: 'Coordenadas fuera de rango' };
    }
    
    return { isValid: true };
  },

  /** Link validation - alias for url */
  link: (data: any): ValidationResult => {
    return SmartValidators.url(data);
  },
  
  /** Text validation - any non-empty text */
  text: (data: any): ValidationResult => {
    if (!data.text || data.text.trim().length === 0) {
      return { isValid: false, message: 'Ingresa texto' };
    }
    
    return { isValid: true };
  },

  /** Event validation - title and dates required */
  event: (data: any): ValidationResult => {
    if (!data.summary || data.summary.trim().length === 0) {
      return { isValid: false, message: 'Título requerido' };
    }
    
    if (!data.startDate || !data.startTime) {
      return { isValid: false, message: 'Fecha inicio requerida' };
    }
    
    return { isValid: true };
  },

  /** Contact validation - at least name required */
  contact: (data: any): ValidationResult => {
    if (!data.firstName || data.firstName.trim().length === 0) {
      return { isValid: false, message: 'Nombre requerido' };
    }
    
    return { isValid: true };
  },

  // ============ Linear Barcode Types ============
  
  /** Code 128 - minimum 1 character */
  code128: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** Code 39 - minimum 1 character */
  code39: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** EAN-13 - exactly 13 digits */
  ean13: (data: string): ValidationResult => {
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length < 13) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/13 dígitos`,
        minRequiredLength: 13 
      };
    }
    if (cleaned.length > 13) {
      return { isValid: false, message: 'Máximo 13 dígitos' };
    }
    return { isValid: true };
  },

  /** EAN-8 - exactly 8 digits */
  ean8: (data: string): ValidationResult => {
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length < 8) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/8 dígitos`,
        minRequiredLength: 8 
      };
    }
    if (cleaned.length > 8) {
      return { isValid: false, message: 'Máximo 8 dígitos' };
    }
    return { isValid: true };
  },

  /** UPC-A - exactly 12 digits */
  upca: (data: string): ValidationResult => {
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length < 12) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/12 dígitos`,
        minRequiredLength: 12 
      };
    }
    if (cleaned.length > 12) {
      return { isValid: false, message: 'Máximo 12 dígitos' };
    }
    return { isValid: true };
  },

  /** UPC-E - exactly 8 digits */
  upce: (data: string): ValidationResult => {
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length < 8) {
      return { 
        isValid: false, 
        message: `${cleaned.length}/8 dígitos`,
        minRequiredLength: 8 
      };
    }
    if (cleaned.length > 8) {
      return { isValid: false, message: 'Máximo 8 dígitos' };
    }
    return { isValid: true };
  },

  /** ITF - minimum 2 characters, even length */
  itf: (data: string): ValidationResult => {
    const cleaned = data.replace(/\D/g, '');
    if (cleaned.length < 2) {
      return { isValid: false, message: 'Mínimo 2 dígitos' };
    }
    if (cleaned.length % 2 !== 0) {
      return { isValid: false, message: 'Cantidad par de dígitos' };
    }
    return { isValid: true };
  },

  /** Codabar - minimum 1 character */
  codabar: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** Code 93 - minimum 1 character */
  code93: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  // ============ 2D Barcode Types ============
  
  /** DataMatrix - minimum 1 character */
  datamatrix: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** PDF417 - minimum 1 character */
  pdf417: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** Aztec - minimum 1 character */
  aztec: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },

  /** Generic QR Code - minimum 1 character */
  qrcode: (data: string): ValidationResult => {
    if (!data || data.length === 0) {
      return { isValid: false, message: 'Ingresa datos' };
    }
    return { isValid: true };
  },
  
  /** Link validation - alias for url validator */
  link: (data: any): ValidationResult => {
    return SmartValidators.url(data);
  }
};

/**
 * Get the appropriate validator for a barcode type
 */
export function getValidator(barcodeType: string, qrType?: string): ((data: any) => ValidationResult) | null {
  const validatorKey = barcodeType === 'qrcode' && qrType ? qrType : barcodeType;
  return SmartValidators[validatorKey as keyof typeof SmartValidators] || null;
}

/**
 * Optimized generation delays by type (milliseconds)
 * Shorter delays for simple validations, longer for complex inputs
 */
export const GENERATION_DELAYS: Record<string, number> = {
  // Instant - already validated locally
  ean13: 200,
  ean8: 200,
  upca: 200,
  upce: 200,
  
  // Fast - simple validation
  text: 300,
  code128: 300,
  code39: 300,
  codabar: 300,
  code93: 300,
  datamatrix: 300,
  pdf417: 300,
  aztec: 300,
  itf: 300,
  
  // Moderate - requires more input
  url: 500,
  link: 500,
  email: 400,
  location: 400,
  
  // Slow - complex input
  wifi: 500,
  whatsapp: 500,
  sms: 500,
  phone: 500,
  event: 500,
  contact: 500,
  
  // Default
  qrcode: 400
};

/**
 * Get the optimal delay for a barcode type
 */
export function getGenerationDelay(barcodeType: string, qrType?: string): number {
  const key = barcodeType === 'qrcode' && qrType ? qrType : barcodeType;
  return GENERATION_DELAYS[key] || GENERATION_DELAYS.qrcode;
}