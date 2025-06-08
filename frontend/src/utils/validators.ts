// Validadores para diferentes tipos de contenido QR

export const validators = {
  url: (value: string): boolean => {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },

  email: (value: string): boolean => {
    if (!value) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value: string): boolean => {
    if (!value) return false;
    // Acepta números con o sin código de país
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  },

  bitcoin: (value: string): boolean => {
    if (!value) return false;
    // Bitcoin address validation (basic)
    const btcRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
    return btcRegex.test(value);
  },

  twitter: (value: string): boolean => {
    if (!value) return false;
    // Twitter username
    const twitterRegex = /^@?[A-Za-z0-9_]{1,15}$/;
    return twitterRegex.test(value);
  },

  instagram: (value: string): boolean => {
    if (!value) return false;
    // Instagram username
    const instaRegex = /^@?[A-Za-z0-9._]{1,30}$/;
    return instaRegex.test(value);
  },

  // Para contenido que requiere múltiples campos
  vcard: (data: any): boolean => {
    if (!data) return false;
    // Para vcard, revisar firstName o lastName
    return (data.firstName && data.firstName.trim().length > 0) || 
           (data.lastName && data.lastName.trim().length > 0) ||
           (data.name && data.name.trim().length > 0);
  },

  wifi: (data: any): boolean => {
    if (!data) return false;
    // Para wifi, revisar networkName en lugar de ssid
    return (data.networkName && data.networkName.trim().length > 0) ||
           (data.ssid && data.ssid.trim().length > 0);
  },

  event: (data: any): boolean => {
    if (!data) return false;
    return data.title && data.title.trim().length > 0 && data.startDate;
  },

  // Validador genérico para texto simple
  text: (value: string): boolean => {
    if (!value) return false;
    return value.trim().length > 0;
  }
};

// Determina si el contenido es válido para generar
export const isContentValid = (type: string, data: any): boolean => {
  if (!data) return false;
  
  switch (type) {
    case 'url':
    case 'link':
      return validators.url(typeof data === 'object' ? (data.url || '') : data);
    case 'email':
      return validators.email(typeof data === 'object' ? (data.email || '') : data);
    case 'phone':
    case 'sms':
    case 'whatsapp':
      if (!data) return false;
      if (typeof data === 'object') {
        const phoneNumber = data.phoneNumber || data.phone || '';
        return validators.phone(phoneNumber);
      }
      return validators.phone(data);
    case 'bitcoin':
      return validators.bitcoin(data);
    case 'twitter':
      return validators.twitter(data);
    case 'instagram':
      return validators.instagram(data);
    case 'vcard':
      return validators.vcard(data);
    case 'wifi':
      return validators.wifi(data);
    case 'event':
      return validators.event(data);
    case 'text':
      return validators.text(typeof data === 'object' ? (data.message || '') : data);
    case 'app':
    case 'feedback':
    default:
      if (typeof data === 'object') {
        // Para objetos, verificar si tienen algún contenido relevante
        const text = data.message || data.text || data.content || '';
        return validators.text(text);
      }
      return validators.text(typeof data === 'string' ? data : '');
  }
};

// Determina si debemos esperar más input del usuario
export const shouldWaitForMoreInput = (type: string, value: string): boolean => {
  if (!value) return false;
  
  switch (type) {
    case 'url':
      // Si está escribiendo http... esperar
      return value.length > 0 && value.length < 8;
    case 'email':
      // Si no tiene @ todavía, esperar
      return value.length > 0 && !value.includes('@');
    case 'phone':
    case 'sms':
    case 'whatsapp':
      // Números muy cortos, esperar
      return value.length > 0 && value.length < 6;
    default:
      return false;
  }
};