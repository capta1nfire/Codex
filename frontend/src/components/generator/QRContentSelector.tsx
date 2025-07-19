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
    <div className="space-y-2">
      {/* Material Design Chip Grid */}
      <div className="grid grid-cols-5 gap-2">
        {qrContentTypes.slice(0, 10).map((qrType) => {
          const Icon = qrType.icon;
          const isSelected = selectedQRType === qrType.id;
          
          return (
            <button
              key={qrType.id}
              type="button"
              onClick={() => onQRTypeChange(qrType.id)}
              className={cn(
                // Material Design Chip/Button
                "flex items-center gap-1.5 px-3 py-2.5",
                "rounded-full",
                "transition-all duration-200",
                "relative overflow-hidden",
                // Default state
                "bg-gray-100 dark:bg-gray-800",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                // Selected state
                isSelected && [
                  "bg-blue-100 dark:bg-blue-900/30",
                  "text-blue-700 dark:text-blue-300",
                  "shadow-sm"
                ],
                // Ripple effect on click
                "before:absolute before:inset-0",
                "before:bg-current before:opacity-0",
                "before:transition-opacity before:duration-200",
                "active:before:opacity-10"
              )}
              disabled={isLoading}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors duration-200",
                isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
              )}>
                {qrType.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Segunda fila - Material Design Chips */}
      <div className="grid grid-cols-5 gap-2">
        {qrContentTypes.slice(10).map((qrType) => {
          const Icon = qrType.icon;
          const isSelected = selectedQRType === qrType.id;
          
          return (
            <button
              key={qrType.id}
              type="button"
              onClick={() => onQRTypeChange(qrType.id)}
              className={cn(
                // Material Design Chip/Button
                "flex items-center gap-1.5 px-3 py-2.5",
                "rounded-full",
                "transition-all duration-200",
                "relative overflow-hidden",
                // Default state
                "bg-gray-100 dark:bg-gray-800",
                "hover:bg-gray-200 dark:hover:bg-gray-700",
                // Selected state
                isSelected && [
                  "bg-blue-100 dark:bg-blue-900/30",
                  "text-blue-700 dark:text-blue-300",
                  "shadow-sm"
                ],
                // Ripple effect on click
                "before:absolute before:inset-0",
                "before:bg-current before:opacity-0",
                "before:transition-opacity before:duration-200",
                "active:before:opacity-10"
              )}
              disabled={isLoading}
            >
              <Icon className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors duration-200",
                isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
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