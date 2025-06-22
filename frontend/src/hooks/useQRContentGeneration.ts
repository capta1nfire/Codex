import { useState, useCallback } from 'react';
import { qrDefaultValues } from '@/constants/qrDefaultValues';

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

// Initial form data with default URL for link type
const emptyQRFormData: QRFormData = {
  email: { email: '', subject: '', message: '' },
  call: { countryCode: '+1', phoneNumber: '' },
  sms: { countryCode: '+1', phoneNumber: '', message: '' },
  whatsapp: { countryCode: '+1', phoneNumber: '', message: '' },
  wifi: { networkName: '', password: '', security: 'WPA', hidden: false },
  vcard: { 
    firstName: '', lastName: '', organization: '', title: '',
    phone: '', email: '', website: '', address: '' 
  },
  text: { message: '' },
  link: { url: 'https://tu-sitio-web.com' }
};

export const useQRContentGeneration = () => {
  const [selectedQRType, setSelectedQRType] = useState<string>('link');
  const [qrFormData, setQrFormData] = useState<Record<string, any>>(emptyQRFormData);

  const generateQRContent = useCallback((type: string, data: any): string => {
    // If no data provided, use empty form data
    if (!data) {
      data = emptyQRFormData[type as keyof QRFormData];
    }
    
    // Get default values for this type
    const defaults = qrDefaultValues[type as keyof typeof qrDefaultValues];
    
    // Helper to get value with fallback to default
    const getValueWithDefault = (field: string) => {
      const value = (data as any)[field];
      return value && value.trim() !== '' ? value : (defaults as any)?.[field] || '';
    };
    
    switch (type) {
      case 'email':
        const email = getValueWithDefault('email');
        const subject = getValueWithDefault('subject');
        const message = getValueWithDefault('message');
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        
      case 'call':
        const callPhone = getValueWithDefault('phoneNumber');
        const callCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        return `tel:${callCountry}${callPhone}`;
        
      case 'sms':
        const smsPhone = getValueWithDefault('phoneNumber');
        const smsMessage = getValueWithDefault('message');
        const smsCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        return `sms:${smsCountry}${smsPhone}?body=${encodeURIComponent(smsMessage)}`;
        
      case 'whatsapp':
        const waPhone = getValueWithDefault('phoneNumber');
        const waMessage = getValueWithDefault('message');
        const waCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        const whatsappNumber = `${waCountry}${waPhone}`.replace(/\D/g, '');
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;
        
      case 'wifi':
        const networkName = getValueWithDefault('networkName');
        const password = getValueWithDefault('password');
        const security = (data as any).security || (defaults as any)?.security || 'WPA';
        const hidden = (data as any).hidden !== undefined ? (data as any).hidden : (defaults as any)?.hidden || false;
        return `WIFI:T:${security};S:${networkName};P:${password};H:${hidden ? 'true' : 'false'};;`;
        
      case 'vcard':
        const firstName = getValueWithDefault('firstName');
        const lastName = getValueWithDefault('lastName');
        const organization = getValueWithDefault('organization');
        const title = getValueWithDefault('title');
        const phone = getValueWithDefault('phone');
        const vcardEmail = getValueWithDefault('email');
        const website = getValueWithDefault('website');
        const address = getValueWithDefault('address');
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${firstName} ${lastName}\nORG:${organization}\nTITLE:${title}\nTEL:${phone}\nEMAIL:${vcardEmail}\nURL:${website}\nADR:;;${address};;;;\nEND:VCARD`;
        
      case 'text':
        return getValueWithDefault('message');
        
      case 'link':
        return getValueWithDefault('url');
        
      default:
        return 'CODEX QR Generator';
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