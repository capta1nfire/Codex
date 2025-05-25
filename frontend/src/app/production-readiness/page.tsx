'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductionReadinessChecker from '@/components/ProductionReadinessChecker';

export default function ProductionReadinessPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header con navegación de vuelta */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-card/50 hover:border-border hover:bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Link>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Production Readiness Checker
            </h1>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
              Validación completa de preparación para producción
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionReadinessChecker />
      </div>
    </div>
  );
} 