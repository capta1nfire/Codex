/**
 * Smart QR Preview Component
 * Shows a preview of the Smart QR style
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { SmartQRConfig } from '../types';

interface SmartQRPreviewProps {
  config: SmartQRConfig;
  className?: string;
}

export const SmartQRPreview: React.FC<SmartQRPreviewProps> = ({
  config,
  className
}) => {
  // Extract key features from config
  const features = [];
  
  if (config.gradient) {
    features.push({
      label: 'Gradiente',
      value: `${config.gradient.type} (${config.gradient.colors.length} colores)`
    });
  }
  
  if (config.eyeShape) {
    features.push({
      label: 'Forma de ojos',
      value: config.eyeShape
    });
  }
  
  if (config.dataPattern) {
    features.push({
      label: 'Patrón de datos',
      value: config.dataPattern
    });
  }
  
  if (config.logo) {
    features.push({
      label: 'Logo',
      value: 'Incluido'
    });
  }
  
  if (config.effects?.length) {
    features.push({
      label: 'Efectos',
      value: config.effects.join(', ')
    });
  }

  return (
    <div className={cn(
      "space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg",
      className
    )}>
      {/* Visual preview */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Gradient background preview */}
          {config.gradient && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: config.gradient.type === 'linear' 
                  ? `linear-gradient(${config.gradient.angle !== undefined ? config.gradient.angle : 0}deg, ${config.gradient.colors.join(', ')})`
                  : config.gradient.type === 'radial'
                  ? `radial-gradient(circle, ${config.gradient.colors.join(', ')})`
                  : config.gradient.colors[0]
              }}
            />
          )}
          
          {/* Placeholder QR pattern */}
          <div className="absolute inset-4 grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "rounded-sm",
                  // Corner squares (finder patterns)
                  (i === 0 || i === 4 || i === 20 || i === 24) 
                    ? "bg-gray-900 dark:bg-gray-100" 
                    : "bg-gray-400 dark:bg-gray-600",
                  // Apply different opacity for pattern effect
                  i % 3 === 0 && "opacity-60"
                )}
              />
            ))}
          </div>

          {/* Logo preview */}
          {config.logo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-10 h-10 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-xs font-bold text-gray-400",
                config.logo.shape === 'circle' && "rounded-full",
                config.logo.shape === 'rounded' && "rounded-lg"
              )}>
                LOGO
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Características aplicadas:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-xs space-y-0.5"
            >
              <p className="text-gray-500 dark:text-gray-400">
                {feature.label}
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {feature.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Template info */}
      {config._metadata && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Plantilla: <span className="font-medium">{config._metadata.templateName}</span>
          </p>
        </div>
      )}
    </div>
  );
};