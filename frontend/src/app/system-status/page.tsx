'use client';

import SystemStatus from '@/components/SystemStatus';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Activity } from 'lucide-react';

export default function SystemStatusPage() {
  return (
    <ProtectedRoute requiredRole="SUPERADMIN">
      <SystemStatusContent />
    </ProtectedRoute>
  );
}

function SystemStatusContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - SUPERADMIN Theme */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Estado del Sistema
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Control avanzado de servicios y métricas críticas del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          {/* System Status Component with Advanced Mode */}
          <SystemStatus isAdvancedMode={true} />
        </div>
      </div>
    </div>
  );
} 