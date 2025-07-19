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
      "bg-transparent",
      "dark:bg-transparent",
      "border-0",
      "rounded-xl p-5 sm:p-6",
      "shadow-none",
      "transition-all duration-300",
      "animate-fade-in-delayed",
      className
    )}>
      
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