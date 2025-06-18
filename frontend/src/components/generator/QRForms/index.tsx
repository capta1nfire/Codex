import React from 'react';
import { EmailForm } from './EmailForm';
import { PhoneForm } from './PhoneForm';
import { SMSForm } from './SMSForm';
import { WiFiForm } from './WiFiForm';
import { VCardForm } from './VCardForm';
import { TextForm } from './TextForm';
import { LinkForm } from './LinkForm';
import { SMSForm as WhatsAppForm } from './SMSForm'; // Reutilizamos SMSForm para WhatsApp

interface QRFormProps {
  type: string;
  data: any;
  onChange: (type: string, field: string, value: any) => void;
  isLoading: boolean;
  validationError?: string | null;
  urlValidation?: {
    isValidating: boolean;
    metadata: any;
    error: string | null;
  };
}

export const QRForm: React.FC<QRFormProps> = ({ type, data, onChange, isLoading, validationError, urlValidation }) => {
  const handleChange = (field: string, value: any) => {
    onChange(type, field, value);
  };

  switch (type) {
    case 'email':
      return <EmailForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'call':
      return <PhoneForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'sms':
      return <SMSForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'whatsapp':
      return <WhatsAppForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'wifi':
      return <WiFiForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'text':
      return <TextForm data={data} onChange={handleChange} isLoading={isLoading} />;
    case 'link':
      return <LinkForm 
        data={data} 
        onChange={handleChange} 
        isLoading={isLoading} 
        validationError={validationError}
        urlValidation={urlValidation} 
      />;
    case 'vcard':
      return <VCardForm data={data} onChange={handleChange} isLoading={isLoading} />;
    default:
      return null;
  }
};