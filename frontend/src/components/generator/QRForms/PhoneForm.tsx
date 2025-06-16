import React from 'react';
import { Input } from '@/components/ui/input';
import { qrPlaceholders } from '@/constants/qrPlaceholders';

interface PhoneFormProps {
  data: {
    countryCode: string;
    phoneNumber: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const PhoneForm: React.FC<PhoneFormProps> = ({ data, onChange, isLoading }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Country Code</label>
        <Input
          value={data.countryCode}
          onChange={(e) => onChange('countryCode', e.target.value)}
          placeholder="+1"
          className="h-9"
          disabled={isLoading}
        />
      </div>
      <div className="col-span-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
        <Input
          value={data.phoneNumber}
          onChange={(e) => onChange('phoneNumber', e.target.value)}
          placeholder={qrPlaceholders.call.phoneNumber}
          className="h-9"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};