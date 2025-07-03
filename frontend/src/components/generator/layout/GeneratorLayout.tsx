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
      "min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30",
      "dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20",
      // Removed overflow-x-hidden to allow sticky positioning
      
      // REMOVED transform-gpu - it breaks sticky positioning in children
      // "transform-gpu",
      
      // Smooth transitions for theme changes
      "transition-colors duration-300",
      
      className
    )}>
      {/* Fixed animated gradient background - Original design */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl animate-blob"></div>
          <div className="absolute -top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/30 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[40%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Main content wrapper with semantic structure */}
      <div className="relative z-0">
        {children}
      </div>

      {/* CSS animations for blob movement */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}