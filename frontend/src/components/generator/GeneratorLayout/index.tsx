/**
 * Generator Layout Component
 * 
 * Provides the overall layout structure for the generator.
 * Handles responsive design and section organization.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { QrCode } from 'lucide-react';

interface GeneratorLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function GeneratorLayout({ children, className }: GeneratorLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', className)}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Generador de Códigos
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Crea códigos QR y de barras profesionales con opciones avanzadas de personalización
          </p>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            Powered by QR Engine v2 • Alta velocidad y personalización avanzada
          </p>
        </footer>
      </div>
    </div>
  );
}