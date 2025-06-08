import React from 'react';
import { Input } from '@/components/ui/input';

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
  // Check if values are defaults
  const isFirstNameDefault = data.firstName === 'Juan';
  const isLastNameDefault = data.lastName === 'Pérez';
  const isOrganizationDefault = data.organization === 'Tu Empresa';
  const isTitleDefault = data.title === 'Cargo';
  const isPhoneDefault = data.phone === '+1234567890';
  const isEmailDefault = data.email === 'juan@ejemplo.com';
  const isWebsiteDefault = data.website === 'https://ejemplo.com';
  const isAddressDefault = data.address === 'Tu Dirección';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">First Name</label>
          <Input
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder="Juan"
            className={`h-9 ${isFirstNameDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Last Name</label>
          <Input
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            placeholder="Pérez"
            className={`h-9 ${isLastNameDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
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
            placeholder="Tu Empresa"
            className={`h-9 ${isOrganizationDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Title</label>
          <Input
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Cargo"
            className={`h-9 ${isTitleDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
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
            placeholder="+1234567890"
            className={`h-9 ${isPhoneDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email</label>
          <Input
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="juan@ejemplo.com"
            className={`h-9 ${isEmailDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
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
            placeholder="https://ejemplo.com"
            className={`h-9 ${isWebsiteDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Address</label>
          <Input
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Tu Dirección"
            className={`h-9 ${isAddressDefault ? 'text-slate-400 dark:text-slate-600' : ''}`}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};