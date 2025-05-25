'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';
import ProductionReadinessChecker from '@/components/ProductionReadinessChecker';
import QuickActionsPanel from '@/components/QuickActionsPanel';
import CacheMetricsPanel from '@/components/CacheMetricsPanel';

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              Dashboard del Sistema
            </h1>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
              Monitoreo y control de CODEX en tiempo real
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid optimizado */}
      <div>
        <DashboardLayout 
          areas={dashboardAreas}
          className="max-w-none"
        />
      </div>
    </div>
  );
}
