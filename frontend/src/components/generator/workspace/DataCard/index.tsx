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
      // Material Design Surface - Elevation 1
      "bg-white/40 dark:bg-gray-900/40",
      "backdrop-blur-sm",
      "rounded-2xl",
      "shadow-sm",
      "border border-white/10 dark:border-white/5",
      "p-6 sm:p-8",
      "transition-all duration-200",
      className
    )}>
      
      <div className="relative space-y-6">
        {/* Material Design Header Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Contenido
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ingresa la información que contendrá tu código
          </p>
        </div>
        
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
          <div className="space-y-6 animate-fade-in">
            {/* Material Design Form Container */}
            <div className="
              bg-white/30 dark:bg-gray-800/30 
              rounded-xl p-4 
              border border-gray-200/20 dark:border-gray-700/20
              transition-all duration-200 ease-out
            ">
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
            
            {/* Material Design Primary Button */}
            {!autoGenerationEnabled && (
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full h-12",
                  "bg-blue-600 hover:bg-blue-700",
                  "dark:bg-blue-500 dark:hover:bg-blue-600",
                  "text-white font-medium",
                  "rounded-full",
                  "shadow-md hover:shadow-lg",
                  "transition-all duration-200",
                  "transform active:scale-[0.98]"
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
          /* Material Design Text Field */
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-1 relative">
              <Input
                {...register('data', {
                  onChange: (e) => trackInput(e.target.value)
                })}
                placeholder=" "
                className={cn(
                  "h-14 flex-1 pt-4",
                  "bg-white/50 dark:bg-gray-900/50",
                  "border-0 border-b-2",
                  "border-gray-300 dark:border-gray-600",
                  "focus:border-blue-600 dark:focus:border-blue-400",
                  "rounded-t-md",
                  "placeholder:text-transparent",
                  "transition-all duration-200",
                  errors.data && "border-red-500 dark:border-red-400"
                )}
              />
              <label className="absolute left-3 top-4 text-sm text-gray-600 dark:text-gray-400 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600">
                Contenido del código
              </label>
            </div>
            {!autoGenerationEnabled && (
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "h-14 px-8",
                  "bg-blue-600 hover:bg-blue-700",
                  "text-white font-medium",
                  "rounded-full",
                  "shadow-md hover:shadow-lg",
                  "transition-all duration-200",
                  "transform active:scale-[0.98]"
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