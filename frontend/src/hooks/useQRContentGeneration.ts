import { useState, useCallback } from 'react';

interface QRFormData {
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

const defaultQRFormData: QRFormData = {
  email: { email: 'correo@ejemplo.com', subject: 'Asunto', message: 'Mensaje' },
  call: { countryCode: '+1', phoneNumber: '1234567890' },
  sms: { countryCode: '+1', phoneNumber: '1234567890', message: 'Tu mensaje aquí' },
  whatsapp: { countryCode: '+1', phoneNumber: '1234567890', message: 'Hola!' },
  wifi: { networkName: 'NombreRed', password: 'contraseña', security: 'WPA', hidden: false },
  vcard: { 
    firstName: 'Juan', lastName: 'Pérez', organization: 'Tu Empresa', title: 'Cargo',
    phone: '+1234567890', email: 'juan@ejemplo.com', website: 'https://ejemplo.com', address: 'Tu Dirección' 
  },
  text: { message: 'Tu mensaje personalizado aquí' },
  link: { url: 'https://tu-sitio-web.com' }
};

export const useQRContentGeneration = () => {
  const [selectedQRType, setSelectedQRType] = useState<string>('link');
  const [qrFormData, setQrFormData] = useState<Record<string, any>>(defaultQRFormData);

  const generateQRContent = useCallback((type: string, data: any): string => {
    if (!data) return '';
    
    switch (type) {
      case 'email':
        return `mailto:${data.email || ''}?subject=${encodeURIComponent(data.subject || '')}&body=${encodeURIComponent(data.message || '')}`;
      case 'call':
        return `tel:${data.countryCode || ''}${data.phoneNumber || ''}`;
      case 'sms':
        return `sms:${data.countryCode || ''}${data.phoneNumber || ''}?body=${encodeURIComponent(data.message || '')}`;
      case 'whatsapp':
        const countryCode = data?.countryCode || '';
        const phoneNumber = data?.phoneNumber || '';
        const message = data?.message || '';
        const whatsappNumber = `${countryCode}${phoneNumber}`.replace(/\D/g, '');
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      case 'wifi':
        return `WIFI:T:${data.security || 'WPA'};S:${data.networkName || ''};P:${data.password || ''};H:${data.hidden ? 'true' : 'false'};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.firstName || ''} ${data.lastName || ''}\nORG:${data.organization || ''}\nTITLE:${data.title || ''}\nTEL:${data.phone || ''}\nEMAIL:${data.email || ''}\nURL:${data.website || ''}\nADR:;;${data.address || ''};;;;\nEND:VCARD`;
      case 'text':
        return data.message || '';
      case 'link':
        return data.url || '';
      default:
        return '';
    }
  }, []);

  const updateQRFormData = useCallback((type: string, field: string, value: any) => {
    setQrFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    
    const updatedData = {
      ...qrFormData[type],
      [field]: value
    };
    
    return generateQRContent(type, updatedData);
  }, [qrFormData, generateQRContent]);

  return {
    selectedQRType,
    setSelectedQRType,
    qrFormData,
    generateQRContent,
    updateQRFormData,
  };
};