import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneFormProps {
  data: {
    countryCode: string;
    phoneNumber: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const PhoneForm: React.FC<PhoneFormProps> = ({ data, onChange, isLoading }) => {
  // Check if values are defaults
  const isCountryCodeDefault = data.countryCode === '+1';
  const isPhoneNumberDefault = data.phoneNumber === '1234567890';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Country Code</label>
        <Input
          value={data.countryCode}
          onChange={(e) => onChange('countryCode', e.target.value)}
          placeholder="+1"
          className={`h-9 ${isCountryCodeDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
          disabled={isLoading}
        />
      </div>
      <div className="col-span-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
        <Input
          value={data.phoneNumber}
          onChange={(e) => onChange('phoneNumber', e.target.value)}
          placeholder="1234567890"
          className={`h-9 ${isPhoneNumberDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};