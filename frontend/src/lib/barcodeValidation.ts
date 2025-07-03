/**
 * Barcode Validation Library
 * 
 * Provides validation functions for different barcode formats
 */

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const BarcodeValidators: Record<string, (value: string) => ValidationResult> = {
  // Code 128: Alphanumeric
  code128: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa datos para Code 128' };
    if (value.length > 100) return { isValid: false, error: 'Máximo 100 caracteres' };
    return { isValid: true };
  },

  // Code 39: Limited character set
  code39: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa datos para Code 39' };
    const validChars = /^[A-Z0-9\-.\$\/\+\%\*\s]*$/;
    if (!validChars.test(value)) {
      return { isValid: false, error: 'Solo letras mayúsculas, números y: - . $ / + % *' };
    }
    if (value.length > 50) return { isValid: false, error: 'Máximo 50 caracteres' };
    return { isValid: true };
  },

  // EAN-13: Exactly 13 digits
  ean13: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa 13 dígitos' };
    const digits = value.replace(/\s/g, '');
    if (!/^\d{13}$/.test(digits)) {
      return { isValid: false, error: 'Debe ser exactamente 13 dígitos' };
    }
    return { isValid: true };
  },

  // EAN-8: Exactly 8 digits
  ean8: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa 8 dígitos' };
    const digits = value.replace(/\s/g, '');
    if (!/^\d{8}$/.test(digits)) {
      return { isValid: false, error: 'Debe ser exactamente 8 dígitos' };
    }
    return { isValid: true };
  },

  // UPC-A: Exactly 12 digits
  upca: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa 12 dígitos' };
    const digits = value.replace(/\s/g, '');
    if (!/^\d{12}$/.test(digits)) {
      return { isValid: false, error: 'Debe ser exactamente 12 dígitos' };
    }
    return { isValid: true };
  },

  // UPC-E: 6, 7, or 8 digits
  upce: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa 6-8 dígitos' };
    const digits = value.replace(/\s/g, '');
    if (!/^\d{6,8}$/.test(digits)) {
      return { isValid: false, error: 'Debe ser 6, 7 u 8 dígitos' };
    }
    return { isValid: true };
  },

  // ITF-14: Even number of digits, minimum 4
  itf: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa número par de dígitos' };
    const digits = value.replace(/\s/g, '');
    if (!/^\d+$/.test(digits)) {
      return { isValid: false, error: 'Solo números permitidos' };
    }
    if (digits.length < 4) {
      return { isValid: false, error: 'Mínimo 4 dígitos' };
    }
    if (digits.length % 2 !== 0) {
      return { isValid: false, error: 'Debe ser un número par de dígitos' };
    }
    return { isValid: true };
  },

  // MSI: Numeric only
  msi: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa números para MSI' };
    if (!/^\d+$/.test(value)) {
      return { isValid: false, error: 'Solo números permitidos' };
    }
    if (value.length > 20) return { isValid: false, error: 'Máximo 20 dígitos' };
    return { isValid: true };
  },

  // Pharmacode: Number between 3 and 131070
  pharmacode: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa número para Pharmacode' };
    const num = parseInt(value);
    if (isNaN(num)) {
      return { isValid: false, error: 'Debe ser un número' };
    }
    if (num < 3 || num > 131070) {
      return { isValid: false, error: 'Número entre 3 y 131070' };
    }
    return { isValid: true };
  },

  // Data Matrix: Flexible, but size limits
  datamatrix: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa datos para Data Matrix' };
    if (value.length > 2335) return { isValid: false, error: 'Máximo 2335 caracteres' };
    return { isValid: true };
  },

  // PDF417: Large capacity
  pdf417: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa datos para PDF417' };
    if (value.length > 1800) return { isValid: false, error: 'Máximo 1800 caracteres' };
    return { isValid: true };
  },

  // Aztec: Medium capacity
  aztec: (value: string): ValidationResult => {
    if (!value) return { isValid: false, error: 'Ingresa datos para Aztec' };
    if (value.length > 3067) return { isValid: false, error: 'Máximo 3067 caracteres' };
    return { isValid: true };
  }
};

// Helper function to get validator for barcode type
export function getValidator(barcodeType: string) {
  return BarcodeValidators[barcodeType] || BarcodeValidators.code128;
}

// Validate any barcode data
export function validateBarcodeData(barcodeType: string, data: string): ValidationResult {
  const validator = getValidator(barcodeType);
  return validator(data);
}