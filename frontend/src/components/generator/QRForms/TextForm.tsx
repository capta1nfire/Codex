import React from 'react';

interface TextFormProps {
  data: {
    message: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export const TextForm: React.FC<TextFormProps> = ({ data, onChange, isLoading }) => {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Message</label>
      <textarea
        value={data.message}
        onChange={(e) => onChange('message', e.target.value)}
        placeholder="Write your message here"
        className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 resize-none"
        disabled={isLoading}
      />
    </div>
  );
};