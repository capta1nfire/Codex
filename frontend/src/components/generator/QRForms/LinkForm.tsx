import React from 'react';
import { Input } from '@/components/ui/input';

interface LinkFormProps {
  data: {
    url: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const LinkForm: React.FC<LinkFormProps> = ({ data, onChange, isLoading }) => {
  const isDefaultValue = data.url === 'https://tu-sitio-web.com';
  
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-3">Website URL</label>
      <Input
        value={data.url}
        onChange={(e) => onChange('url', e.target.value)}
        placeholder="https://your-website.com"
        className={`h-9 ${isDefaultValue ? 'text-slate-400 dark:text-slate-600' : ''}`}
        disabled={isLoading}
      />
    </div>
  );
};