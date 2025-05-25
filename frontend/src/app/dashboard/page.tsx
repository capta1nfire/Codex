'use client';

import { useState } from 'react';
import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';
import CacheMetricsPanel from '@/components/CacheMetricsPanel';
import AdvancedOptionsMenu from '@/components/AdvancedOptionsMenu';

export default function DashboardPage() {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header - Following Corporate Blue Theme and Sophistication */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Dashboard del Sistema
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Monitoreo y control de CODEX en tiempo real
              </p>
            </div>
            {/* ✅ Menú Hamburguesa Principal - CODEX Design System v2.0 */}
            <AdvancedOptionsMenu 
              isAdvancedMode={isAdvancedMode}
              onAdvancedModeChange={setIsAdvancedMode}
            />
          </div>
        </div>
      </div>

      {/* Dashboard Content - 3 columns with equal height */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: System Status */}
          <div className="h-full">
            <SystemStatus isAdvancedMode={isAdvancedMode} />
          </div>

          {/* Column 2: Cache Metrics */}
          <div className="h-full">
            <CacheMetricsPanel isAdvancedMode={isAdvancedMode} />
          </div>

          {/* Column 3: Performance Analytics */}
          <div className="h-full">
            <RustAnalyticsDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}
