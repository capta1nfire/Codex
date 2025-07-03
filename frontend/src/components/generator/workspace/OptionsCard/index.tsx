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
      "bg-gradient-to-br from-blue-50/80 to-blue-100/80",
      "dark:from-blue-950/50 dark:to-blue-900/50",
      "backdrop-blur-sm border border-blue-200/60 dark:border-blue-800/60",
      "rounded-xl p-5 sm:p-6",
      "shadow-lg shadow-blue-100/20 dark:shadow-blue-900/20",
      "transition-all duration-300",
      "animate-fade-in-delayed",
      className
    )}>
      {/* Card inner glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/5 to-transparent pointer-events-none" />
      
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