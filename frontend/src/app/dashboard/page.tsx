'use client';

import DashboardLayout from '@/components/DashboardLayout';
import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';
import ProductionReadinessChecker from '@/components/ProductionReadinessChecker';
import QuickActionsPanel from '@/components/QuickActionsPanel';
import CacheMetricsPanel from '@/components/CacheMetricsPanel';

export default function DashboardPage() {
  const dashboardAreas = [
    {
      component: SystemStatus,
      gridArea: 'status',
      span: {
        mobile: 1,
        tablet: 1,
        desktop: 1,
        wide: 1,
        ultrawide: 1
      }
    },
    {
      component: CacheMetricsPanel,
      gridArea: 'cache',
      span: {
        mobile: 1,
        tablet: 1,
        desktop: 1,
        wide: 1,
        ultrawide: 1
      }
    },
    {
      component: RustAnalyticsDisplay,
      gridArea: 'analytics',
      span: {
        mobile: 1,
        tablet: 1,
        desktop: 1,
        wide: 1,
        ultrawide: 1
      }
    },
    {
      component: QuickActionsPanel,
      gridArea: 'quick',
      span: {
        mobile: 1,
        tablet: 1,
        desktop: 1,
        wide: 1,
        ultrawide: 1
      }
    },
    {
      component: ProductionReadinessChecker,
      gridArea: 'readiness',
      span: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4,
        ultrawide: 5
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header - Following Corporate Blue Theme and Sophistication */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 border border-blue-200/50 dark:border-blue-800/50">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm opacity-90"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Dashboard del Sistema
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Monitoreo y control de CODEX en tiempo real
              </p>
            </div>
          </div>
          
          {/* Status Indicator - Subtle but Informative */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Sistema Operativo
              </span>
            </div>
            <div className="text-xs text-muted-foreground/60">
              Última actualización: {new Date().toLocaleTimeString('es-ES')}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid optimizado */}
      <div className="p-4 sm:p-6 lg:p-8">
        <DashboardLayout 
          areas={dashboardAreas}
          className="max-w-none"
        />
      </div>
    </div>
  );
}
