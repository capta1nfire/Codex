import React from 'react';
import { cn } from '@/lib/utils';
import { qrContentTypes } from '@/constants/qrContentTypes';

interface QRContentSelectorProps {
  selectedQRType: string;
  onQRTypeChange: (type: string) => void;
  isLoading: boolean;
}

export const QRContentSelector: React.FC<QRContentSelectorProps> = ({
  selectedQRType,
  onQRTypeChange,
  isLoading
}) => {
  return (
    <div className="space-y-1.5 mb-3">
      {/* Grid de tipos de contenido QR */}
      <div className="grid grid-cols-5 gap-1.5">
        {qrContentTypes.slice(0, 10).map((qrType) => {
          const Icon = qrType.icon;
          const isSelected = selectedQRType === qrType.id;
          
          return (
            <button
              key={qrType.id}
              type="button"
              onClick={() => onQRTypeChange(qrType.id)}
              className={cn(
                "flex items-center gap-1 p-2 rounded-lg transition-all duration-200 group",
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
                "hover:shadow-md hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600",
                "hover:transform hover:scale-105 hover:-translate-y-0.5",
                isSelected && [
                  "bg-gradient-to-br from-corporate-blue-50 to-corporate-blue-100/50",
                  "dark:from-corporate-blue-950 dark:to-corporate-blue-900/50",
                  "border-corporate-blue-400 dark:border-corporate-blue-500",
                  "shadow-md shadow-corporate-blue-500/10"
                ]
              )}
              disabled={isLoading}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-all duration-200",
                "group-hover:scale-110",
                isSelected ? "text-corporate-blue-600 dark:text-corporate-blue-400" : "text-slate-600 dark:text-slate-400"
              )} />
              <span className={cn(
                "text-xs font-medium text-left truncate transition-colors duration-200",
                isSelected ? "text-corporate-blue-700 dark:text-corporate-blue-300" : "text-slate-600 dark:text-slate-400"
              )}>
                {qrType.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Segunda fila para los tipos restantes */}
      <div className="grid grid-cols-5 gap-1.5">
        {qrContentTypes.slice(10).map((qrType) => {
          const Icon = qrType.icon;
          const isSelected = selectedQRType === qrType.id;
          
          return (
            <button
              key={qrType.id}
              type="button"
              onClick={() => onQRTypeChange(qrType.id)}
              className={cn(
                "flex items-center gap-1 p-2 rounded-lg transition-all duration-200 group",
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
                "hover:shadow-md hover:border-corporate-blue-300 dark:hover:border-corporate-blue-600",
                "hover:transform hover:scale-105 hover:-translate-y-0.5",
                isSelected && [
                  "bg-gradient-to-br from-corporate-blue-50 to-corporate-blue-100/50",
                  "dark:from-corporate-blue-950 dark:to-corporate-blue-900/50",
                  "border-corporate-blue-400 dark:border-corporate-blue-500",
                  "shadow-md shadow-corporate-blue-500/10"
                ]
              )}
              disabled={isLoading}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-all duration-200",
                "group-hover:scale-110",
                isSelected ? "text-corporate-blue-600 dark:text-corporate-blue-400" : "text-slate-600 dark:text-slate-400"
              )} />
              <span className={cn(
                "text-xs font-medium text-left truncate transition-colors duration-200",
                isSelected ? "text-corporate-blue-700 dark:text-corporate-blue-300" : "text-slate-600 dark:text-slate-400"
              )}>
                {qrType.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};