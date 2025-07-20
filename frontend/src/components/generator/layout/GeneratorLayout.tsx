/**
 * GeneratorLayout - Main layout container for the QR/Barcode generator
 * 
 * Modern UI/UX principles applied:
 * - Semantic HTML structure
 * - Responsive grid system
 * - Smooth transitions
 * - Accessibility first
 * - Performance optimized
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GeneratorLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function GeneratorLayout({ children, className }: GeneratorLayoutProps) {
  return (
    <div className={cn(
      // Base layout styles with overflow control
      "min-h-screen",
      // Smooth transitions for theme changes
      "transition-colors duration-300",
      
      className
    )}>
      {/* Minimalist gradient mesh background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(at 30% 20%, rgba(59, 130, 246, 0.15) 0px, transparent 60%),
            radial-gradient(at 80% 80%, rgba(147, 51, 234, 0.1) 0px, transparent 60%)
          `,
          backgroundColor: 'rgb(250 250 251)',
        }}
      />
      
      {/* Dark mode gradient mesh */}
      <div 
        className="fixed inset-0 -z-10 dark:block hidden"
        style={{
          backgroundImage: `
            radial-gradient(at 30% 20%, rgba(59, 130, 246, 0.1) 0px, transparent 60%),
            radial-gradient(at 80% 80%, rgba(147, 51, 234, 0.07) 0px, transparent 60%)
          `,
          backgroundColor: 'rgb(15 23 42)',
        }}
      />

      {/* Main content wrapper with semantic structure */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}