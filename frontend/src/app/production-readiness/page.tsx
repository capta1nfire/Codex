'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart2 } from 'lucide-react';
import ProductionReadinessChecker from '@/components/ProductionReadinessChecker';
import AdvancedOptionsMenu from '@/components/AdvancedOptionsMenu';

export default function ProductionReadinessPage() {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header con navegación home y menú */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-border/50 bg-card/50 hover:border-border hover:bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 group/home"
                title="Ir al Dashboard"
              >
                <BarChart2 className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover/home:text-primary group-hover/home:scale-110" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Production Readiness Checker
                </h1>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                  Validación completa de preparación para producción
                </p>
              </div>
            </div>
            
            {/* Menú Hamburguesa - Mismo que en Dashboard */}
            <AdvancedOptionsMenu 
              isAdvancedMode={isAdvancedMode}
              onAdvancedModeChange={setIsAdvancedMode}
            />
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