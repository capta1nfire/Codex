/**
 * DataCard - Main data input card with QR type selector and forms
 * 
 * Design principles:
 * - Progressive disclosure
 * - Clear visual feedback
 * - Responsive form layouts
 * - Accessibility compliant
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { QRContentSelector } from '@/components/generator/QRContentSelector';
import { QRForm } from '@/components/generator/QRForms';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DataCardProps {
  selectedType: string;
  selectedQRType: string;
  qrFormData: Record<string, any>;
  isLoading: boolean;
  autoGenerationEnabled: boolean;
  realTimeValidationError: string | null;
  isValidatingUrl: boolean;
  urlMetadata: any;
  urlValidationError: any;
  urlValidationState: {
    exists: boolean | null;
    shouldGenerateAnyway: boolean;
    isValidating: boolean;
  };
  errors: any;
  register: any;
  setValue: any;
  getValues: any;
  onQRTypeChange: (type: string) => void;
  onQRFormChange: (type: string, field: string, value: any) => void;
  onUrlValidationComplete: (exists: boolean | null, error: any, url: string) => void;
  onGenerateAnyway: () => void;
  trackInput: (value: string) => void;
  className?: string;
}

export function DataCard({
  selectedType,
  selectedQRType,
  qrFormData,
  isLoading,
  autoGenerationEnabled,
  realTimeValidationError,
  isValidatingUrl,
  urlMetadata,
  urlValidationError,
  urlValidationState,
  errors,
  register,
  setValue,
  getValues,
  onQRTypeChange,
  onQRFormChange,
  onUrlValidationComplete,
  onGenerateAnyway,
  trackInput,
  className
}: DataCardProps) {
  return (
    <div className={cn(
      "bg-gradient-to-br from-slate-50/80 to-slate-100/80",
      "dark:from-slate-950/50 dark:to-slate-900/50",
      "backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60",
      "rounded-xl p-5 sm:p-6",
      "shadow-lg shadow-slate-100/20 dark:shadow-slate-900/20",
      "transition-all duration-300",
      "ring-1 ring-[#757DBA]/30",
      className
    )}>
      {/* Card inner glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#757DBA]/10 to-transparent pointer-events-none" />
      
      <div className="relative space-y-5">
        {/* QR Content Selector - Only show for QR codes */}
        {selectedType === 'qrcode' && (
          <div className="animate-fade-in">
            <QRContentSelector
              selectedQRType={selectedQRType}
              onQRTypeChange={onQRTypeChange}
              isLoading={isLoading}
            />
          </div>
        )}
        
        {/* Dynamic Forms based on type */}
        {selectedType === 'qrcode' ? (
          <div className="space-y-5 animate-fade-in">
            {/* QR Form with smooth transitions */}
            <div className="transition-all duration-300 ease-out">
              <QRForm
                type={selectedQRType}
                data={qrFormData[selectedQRType]}
                onChange={onQRFormChange}
                isLoading={isLoading}
                validationError={selectedQRType === 'link' ? realTimeValidationError : null}
                urlValidation={selectedQRType === 'link' ? {
                  isValidating: isValidatingUrl,
                  metadata: urlMetadata,
                  error: urlValidationError
                } : undefined}
                onUrlValidationComplete={selectedQRType === 'link' ? onUrlValidationComplete : undefined}
                urlExists={selectedQRType === 'link' ? urlValidationState.exists : undefined}
                onGenerateAnyway={selectedQRType === 'link' ? onGenerateAnyway : undefined}
                shouldShowGenerateAnywayButton={
                  selectedQRType === 'link' && 
                  urlValidationState.exists === false && 
                  !urlValidationState.shouldGenerateAnyway
                }
              />
            </div>
            
            {/* Manual Generate Button - Hidden when auto-generation is on */}
            {!autoGenerationEnabled && (
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full h-11",
                  "bg-gradient-to-r from-blue-600 to-blue-700",
                  "hover:from-blue-700 hover:to-blue-800",
                  "dark:from-blue-500 dark:to-blue-600",
                  "dark:hover:from-blue-600 dark:hover:to-blue-700",
                  "text-white font-medium",
                  "shadow-lg shadow-blue-600/25",
                  "transition-all duration-200",
                  "transform hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generando...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generar Código
                  </span>
                )}
              </Button>
            )}
          </div>
        ) : (
          /* Simple input for non-QR barcodes */
          <div className="flex gap-3 animate-fade-in">
            <Input
              {...register('data', {
                onChange: (e) => trackInput(e.target.value)
              })}
              placeholder="Ingresa el contenido del código..."
              className={cn(
                "h-11 flex-1",
                "bg-white/80 dark:bg-slate-900/80",
                "border-blue-200 dark:border-blue-800",
                "focus:border-blue-400 dark:focus:border-blue-600",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                errors.data && "border-red-400 dark:border-red-600"
              )}
            />
            {!autoGenerationEnabled && (
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "h-11 px-6",
                  "bg-gradient-to-r from-blue-600 to-blue-700",
                  "hover:from-blue-700 hover:to-blue-800",
                  "text-white font-medium",
                  "shadow-lg shadow-blue-600/25",
                  "transition-all duration-200",
                  "transform hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Generar"
                )}
              </Button>
            )}
          </div>
        )}
        
        {/* Error Messages */}
        {errors.data && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 animate-fade-in">
            {errors.data.message}
          </p>
        )}
      </div>
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in 0.3s ease-out 0.1s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}