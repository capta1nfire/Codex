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
    email: 'correo@tu-sitio-web.com', 
    subject: 'Asunto del mensaje', 
    message: 'Mensaje generado con QR' 
  },
  call: { 
    countryCode: '+1', 
    phoneNumber: '5555555555' 
  },
  sms: { 
    countryCode: '+1', 
    phoneNumber: '5555555555', 
    message: 'Mensaje de texto QR' 
  },
  whatsapp: { 
    countryCode: '+1', 
    phoneNumber: '5555555555', 
    message: 'Hola desde QR!' 
  },
  wifi: { 
    networkName: 'Mi-Red-WiFi', 
    password: 'contraseña123', 
    security: 'WPA', 
    hidden: false 
  },
  vcard: { 
    firstName: 'Nombre', 
    lastName: 'Apellido', 
    organization: 'Mi Empresa', 
    title: 'Cargo',
    phone: '+15555555555', 
    email: 'contacto@tu-sitio-web.com', 
    website: 'https://tu-sitio-web.com', 
    address: 'Calle 123, Ciudad, País 12345' 
  },
  text: { 
    message: 'Generador Profesional de QR' 
  },
  link: { 
    url: 'https://tu-sitio-web.com' 
  }
};