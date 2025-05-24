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
        tablet: 2,
        desktop: 2,
        wide: 1,
        ultrawide: 2
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
      {/* Header optimizado */}
      <div className="bg-card/50 border-b px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-none">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard del Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoreo y control de CODEX en tiempo real
          </p>
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
