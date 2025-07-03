/**
 * GeneratorHeader - Progress indicator with 3 steps
 * 
 * Modern UI patterns:
 * - Micro-interactions on hover/active states
 * - Smooth animated transitions
 * - Responsive design with mobile optimization
 * - Clear visual hierarchy
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GeneratorHeaderProps {
  currentStep: number;
  hasData: boolean;
  isPersonalized: boolean;
  className?: string;
}

// Step configuration for maintainability
const STEPS = [
  { id: 1, label: 'Ingresa', shortLabel: 'Datos' },
  { id: 2, label: 'Personaliza', shortLabel: 'Estilo' },
  { id: 3, label: 'Descarga', shortLabel: 'Listo' }
] as const;

export function GeneratorHeader({ 
  currentStep = 1, 
  hasData = false, 
  isPersonalized = false,
  className 
}: GeneratorHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getStepState = (stepId: number) => {
    if (stepId === 1) return hasData ? 'complete' : 'active';
    if (stepId === 2) return isPersonalized ? 'complete' : hasData ? 'active' : 'pending';
    if (stepId === 3) return isPersonalized ? 'active' : 'pending';
    return 'pending';
  };

  return (
    <div className={cn(
      "w-full",
      "px-4 py-3 sm:px-6 lg:px-8",
      className
    )}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const state = getStepState(step.id);
            const isLast = index === STEPS.length - 1;
            
            return (
              <React.Fragment key={step.id}>
                {/* Step */}
                <div 
                  className={cn(
                    "flex items-center gap-3 group",
                    "opacity-0 translate-y-5",
                    mounted && "animate-fade-in-up",
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  {/* Step Number Circle */}
                  <div className="relative">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        "text-xs font-semibold transition-all duration-300",
                        "ring-1 ring-offset-1 ring-offset-white dark:ring-offset-slate-900",
                        "transform hover:scale-105 active:scale-95",
                        
                        // State-based styles
                        state === 'complete' && [
                          "bg-green-500 text-white",
                          "ring-green-500/30",
                          "shadow-lg shadow-green-500/25"
                        ],
                        state === 'active' && [
                          "bg-blue-600 text-white",
                          "ring-blue-600/30",
                          "shadow-lg shadow-blue-600/25",
                          "animate-pulse-subtle"
                        ],
                        state === 'pending' && [
                          "bg-slate-100 dark:bg-slate-800 text-slate-400",
                          "ring-slate-200 dark:ring-slate-700",
                          "group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                        ]
                      )}
                    >
                      {state === 'complete' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    
                    {/* Ripple effect for active state */}
                    {state === 'active' && (
                      <div className="absolute inset-0 rounded-full bg-blue-600 animate-ripple" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="hidden sm:block">
                    <div className={cn(
                      "text-xs font-medium transition-colors",
                      state === 'complete' && "text-green-600 dark:text-green-400",
                      state === 'active' && "text-blue-600 dark:text-blue-400",
                      state === 'pending' && "text-slate-400 dark:text-slate-500"
                    )}>
                      {step.label}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 mx-2 sm:mx-3">
                    <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
                      <div
                        className={cn(
                          "absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-green-500",
                          "transition-all duration-500 ease-out"
                        )}
                        style={{
                          width: state === 'complete' || (index === 0 && hasData) ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Mobile step indicator */}
        <div className="sm:hidden mt-4 text-center">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Paso {currentStep} de {STEPS.length}
          </span>
        </div>
      </div>
      
      {/* Add custom animations to global CSS */}
      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        
        .animate-ripple {
          animation: ripple 1.5s ease-out infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}