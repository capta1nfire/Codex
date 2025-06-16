import React from 'react';
import { Input } from '@/components/ui/input';
import { qrPlaceholders } from '@/constants/qrPlaceholders';

interface VCardFormProps {
  data: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    website: string;
    address: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const VCardForm: React.FC<VCardFormProps> = ({ data, onChange, isLoading }) => {

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
          <Input
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder={qrPlaceholders.vcard.firstName}
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
          <Input
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            placeholder={qrPlaceholders.vcard.lastName}
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Organization</label>
          <Input
            value={data.organization}
            onChange={(e) => onChange('organization', e.target.value)}
            placeholder={qrPlaceholders.vcard.organization}
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Title</label>
          <Input
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder={qrPlaceholders.vcard.title}
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
          <Input
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder={qrPlaceholders.vcard.phone}
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email</label>
          <Input
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder={qrPlaceholders.vcard.email}
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Website</label>
          <Input
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder={qrPlaceholders.vcard.website}
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Address</label>
          <Input
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder={qrPlaceholders.vcard.address}
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};