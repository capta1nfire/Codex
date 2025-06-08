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
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Website URL</label>
      <Input
        value={data.url}
        onChange={(e) => onChange('url', e.target.value)}
        placeholder="https://your-website.com"
        className="h-9"
        disabled={isLoading}
      />
    </div>
  );
};