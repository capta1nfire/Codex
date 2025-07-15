/**
 * HeroSection - Marketing hero section
 * 
 * Modern design elements:
 * - Gradient text effects
 * - Animated badge
 * - Responsive typography
 */

import React from 'react';
import { QrCode } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm border-t border-slate-200/30 dark:border-slate-700/30 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 text-sm font-medium shadow-lg backdrop-blur-sm animate-bounce">
            <QrCode className="h-4 w-4" />
            Generador Profesional
          </div>
          
          {/* Main Title with Gradient */}
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-200 dark:to-slate-100 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Códigos QR y Barras
            </span>
            <br />
            <span className="text-blue-600 dark:text-blue-400">
              de Calidad Profesional
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
            Genera códigos de alta calidad con opciones avanzadas de personalización para uso empresarial y personal.
          </p>
        </div>
      </div>

    </section>
  );
}