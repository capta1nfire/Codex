import React from 'react';
import { Input } from '@/components/ui/input';

interface WiFiFormProps {
  data: {
    networkName: string;
    password: string;
    security: string;
    hidden: boolean;
  };
  onChange: (field: string, value: any) => void;
  isLoading: boolean;
}

export const WiFiForm: React.FC<WiFiFormProps> = ({ data, onChange, isLoading }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Network Name</label>
          <Input
            value={data.networkName}
            onChange={(e) => onChange('networkName', e.target.value)}
            placeholder="WiFi Network Name"
            className="h-9"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password</label>
          <Input
            value={data.password}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder="Password"
            type="password"
            className="h-9"
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Security</label>
          <select
            value={data.security}
            onChange={(e) => onChange('security', e.target.value)}
            className="w-full h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950"
            disabled={isLoading}
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Open Network</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={data.hidden}
              onChange={(e) => onChange('hidden', e.target.checked)}
              disabled={isLoading}
            />
            Hidden Network
          </label>
        </div>
      </div>
    </div>
  );
};