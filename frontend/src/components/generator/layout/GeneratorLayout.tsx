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
      "min-h-screen bg-gradient-to-br from-white via-purple-50/10 to-pink-50/10",
      "dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20",
      // ⚠️ IMPORTANTE: NO añadir overflow-x-hidden - rompe el sticky positioning
      // ⚠️ IMPORTANTE: NO añadir transform-gpu - rompe el sticky positioning en children
      
      // REMOVED transform-gpu - it breaks sticky positioning in children
      // "transform-gpu",
      
      // Smooth transitions for theme changes
      "transition-colors duration-300",
      
      className
    )}>
      {/* QR Diffusion-inspired gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20"></div>
        <div className="fixed inset-0 overflow-hidden">
          {/* Pink gradient blob */}
          <div className="absolute -top-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-radial from-[#ff80b5]/40 to-[#ff80b5]/10 blur-3xl animate-blob"></div>
          {/* Purple gradient blob */}
          <div className="absolute -bottom-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-radial from-[#9089fc]/40 to-[#9089fc]/10 blur-3xl animate-blob animation-delay-2000"></div>
          {/* Indigo accent blob */}
          <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-gradient-radial from-indigo-400/20 to-indigo-300/5 blur-3xl animate-blob animation-delay-4000"></div>
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