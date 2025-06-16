/**
 * QR Default Values
 * 
 * Valores por defecto internos para generar QR codes iniciales.
 * Estos valores NO se muestran en los inputs, solo se usan
 * para generar el QR code cuando los campos están vacíos.
 */

export interface QRDefaultValues {
  email: { email: string; subject: string; message: string };
  call: { countryCode: string; phoneNumber: string };
  sms: { countryCode: string; phoneNumber: string; message: string };
  whatsapp: { countryCode: string; phoneNumber: string; message: string };
  wifi: { networkName: string; password: string; security: string; hidden: boolean };
  vcard: { 
    firstName: string; 
    lastName: string; 
    organization: string; 
    title: string;
    phone: string; 
    email: string; 
    website: string; 
    address: string;
  };
  text: { message: string };
  link: { url: string };
}

export const qrDefaultValues: QRDefaultValues = {
  email: { 
    email: 'hello@codex.app', 
    subject: 'CODEX QR', 
    message: 'Generated with CODEX' 
  },
  call: { 
    countryCode: '+1', 
    phoneNumber: '5555555555' 
  },
  sms: { 
    countryCode: '+1', 
    phoneNumber: '5555555555', 
    message: 'CODEX QR Message' 
  },
  whatsapp: { 
    countryCode: '+1', 
    phoneNumber: '5555555555', 
    message: 'Hello from CODEX!' 
  },
  wifi: { 
    networkName: 'CODEX-WiFi', 
    password: 'secure123', 
    security: 'WPA', 
    hidden: false 
  },
  vcard: { 
    firstName: 'CODEX', 
    lastName: 'User', 
    organization: 'CODEX App', 
    title: 'QR Generator',
    phone: '+15555555555', 
    email: 'info@codex.app', 
    website: 'https://codex.app', 
    address: '123 QR Street, Code City, QR 12345' 
  },
  text: { 
    message: 'CODEX - Professional QR Generator' 
  },
  link: { 
    url: 'https://codex.app' 
  }
};