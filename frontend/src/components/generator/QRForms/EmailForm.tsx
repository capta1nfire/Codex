import React from 'react';
import { Input } from '@/components/ui/input';
import { qrPlaceholders } from '@/constants/qrPlaceholders';

interface EmailFormProps {
  data: {
    email: string;
    subject: string;
    message: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const EmailForm: React.FC<EmailFormProps> = ({ data, onChange, isLoading }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email</label>
          <Input
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder={qrPlaceholders.email.email}
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Subject</label>
          <Input
            value={data.subject}
            onChange={(e) => onChange('subject', e.target.value)}
            placeholder={qrPlaceholders.email.subject}
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
        <textarea
          value={data.message}
          onChange={(e) => onChange('message', e.target.value)}
          placeholder={qrPlaceholders.email.message}
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          disabled={isLoading}
        />
      </div>
    </div>
  );
};