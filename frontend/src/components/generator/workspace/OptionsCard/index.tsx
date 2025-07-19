/**
 * OptionsCard - Advanced options card wrapper
 * 
 * Design principles:
 * - Consistent styling with DataCard
 * - Clear visual separation
 * - Smooth transitions
 */

import React from 'react';
import { cn } from '@/lib/utils';
import GenerationOptions from '@/components/generator/GenerationOptions';

interface OptionsCardProps {
  control: any;
  errors: any;
  watch: any;
  isLoading: boolean;
  selectedType: string;
  reset: any;
  setValue: any;
  getValues: any;
  onSubmit: any;
  className?: string;
}

export function OptionsCard({
  control,
  errors,
  watch,
  isLoading,
  selectedType,
  reset,
  setValue,
  getValues,
  onSubmit,
  className
}: OptionsCardProps) {
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
      "animate-fade-in-delayed",
      className
    )}>
      
      {/* Material Design Header Section */}
      <div className="space-y-2 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Personalización
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ajusta el estilo y apariencia de tu código
        </p>
      </div>
      
      <div className="relative">
        <GenerationOptions
          control={control}
          errors={errors}
          watch={watch}
          isLoading={isLoading}
          selectedType={selectedType}
          reset={reset}
          setValue={setValue}
          getValues={getValues}
          onSubmit={onSubmit}
        />
      </div>
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.4s ease-out 0.2s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}