/**
 * PreviewColumn - Sticky preview column wrapper
 * 
 * Design principles:
 * - Sticky positioning for constant visibility
 * - Glassmorphism background
 * - Smooth transitions
 * - Responsive behavior
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { PreviewSection } from '@/components/generator/PreviewSectionV3';

interface PreviewColumnProps {
  svgContent: string | null;
  enhancedData: string | null;
  isLoading: boolean;
  barcodeType: string;
  isUserTyping: boolean;
  validationError: string | null;
  urlGenerationState: string;
  className?: string;
}

export function PreviewColumn({
  svgContent,
  enhancedData,
  isLoading,
  barcodeType,
  isUserTyping,
  validationError,
  urlGenerationState,
  className
}: PreviewColumnProps) {
  return (
    <div className={cn("lg:col-span-1 relative border-4 border-purple-500", className)}>
      {/* Background layer with glassmorphism effect */}
      <div 
        id="preview-background" 
        className={cn(
          "absolute inset-0 z-0",
          "bg-gradient-to-br from-white/60 via-blue-50/40 to-white/60",
          "dark:from-slate-900/60 dark:via-blue-950/40 dark:to-slate-900/60",
          "backdrop-blur-xl",
          "rounded-xl",
          "border border-blue-100/40 dark:border-blue-900/40",
          "shadow-xl shadow-blue-100/20 dark:shadow-blue-900/20"
        )}
      />
      
      {/* Decorative elements - Behind content */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />
      </div>
      
      {/* Functional preview component */}
      <PreviewSection
        svgContent={svgContent}
        enhancedData={enhancedData}
        isLoading={isLoading}
        barcodeType={barcodeType}
        isUsingV2={false}
        isUsingV3Enhanced={barcodeType === 'qrcode'}
        showCacheIndicator={false}
        isUserTyping={isUserTyping}
        validationError={validationError}
        isInitialDisplay={false}
        className={cn(
          "sticky top-6 relative z-30",
          "animate-fade-in-delayed"
        )}
        urlGenerationState={urlGenerationState}
      />
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateX(20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.5s ease-out 0.3s;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}