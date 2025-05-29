'use client';

import ProductionReadinessChecker from '@/components/ProductionReadinessChecker';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProductionReadinessPage() {
  return (
    <ProtectedRoute requiredRoles={['PRO', 'ENTERPRISE', 'ADMIN', 'SUPERADMIN']}>
      <ProductionReadinessContent />
    </ProtectedRoute>
  );
}

function ProductionReadinessContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header con navegación home y menú */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
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
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductionReadinessChecker />
      </div>
    </div>
  );
}