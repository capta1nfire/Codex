/**
 * QR Form Placeholders
 * 
 * Placeholders visuales para los formularios de QR.
 * Estos valores se muestran como placeholder (texto gris)
 * pero NO como valores del input.
 */

export interface QRPlaceholders {
  email: { email: string; subject: string; message: string };
  call: { phoneNumber: string };
  sms: { phoneNumber: string; message: string };
  whatsapp: { phoneNumber: string; message: string };
  wifi: { networkName: string; password: string };
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

export const qrPlaceholders: QRPlaceholders = {
  email: { 
    email: 'correo@ejemplo.com', 
    subject: 'Asunto del correo', 
    message: 'Escribe tu mensaje aquí' 
  },
  call: { 
    phoneNumber: '1234567890' 
  },
  sms: { 
    phoneNumber: '1234567890', 
    message: 'Tu mensaje de texto' 
  },
  whatsapp: { 
    phoneNumber: '1234567890', 
    message: 'Hola! Este es mi mensaje' 
  },
  wifi: { 
    networkName: 'Nombre de tu red WiFi', 
    password: 'Contraseña de tu red' 
  },
  vcard: { 
    firstName: 'Nombre', 
    lastName: 'Apellido', 
    organization: 'Nombre de tu empresa', 
    title: 'Tu cargo o puesto',
    phone: '+1234567890', 
    email: 'tu-email@ejemplo.com', 
    website: 'https://tu-sitio-web.com', 
    address: 'Tu dirección completa' 
  },
  text: { 
    message: 'Escribe tu texto personalizado aquí' 
  },
  link: { 
    url: 'https://tu-sitio-web.com' 
  }
};