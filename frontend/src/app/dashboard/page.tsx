'use client';

import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';
import CacheMetricsPanel from '@/components/CacheMetricsPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="SUPERADMIN">
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-blue-50/30 via-slate-50/20 to-corporate-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground">
      {/* Optimized Dashboard Content - 3 Column Layout for Maximum Space Efficiency */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {/* Column 1: System Status */}
          <div className="flex flex-col h-full min-h-[600px]">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-corporate-blue-200/30 dark:border-corporate-blue-700/30 shadow-corporate-lg hover:shadow-corporate-hero transition-all duration-300 flex-1 flex flex-col">
              <SystemStatus isAdvancedMode={true} />
            </div>
          </div>

          {/* Column 2: Performance Analytics */}
          <div className="flex flex-col h-full min-h-[600px]">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-corporate-blue-200/30 dark:border-corporate-blue-700/30 shadow-corporate-lg hover:shadow-corporate-hero transition-all duration-300 flex-1 flex flex-col">
              <RustAnalyticsDisplay />
            </div>
          </div>

          {/* Column 3: Cache Metrics */}
          <div className="flex flex-col h-full min-h-[600px]">
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-corporate-blue-200/30 dark:border-corporate-blue-700/30 shadow-corporate-lg hover:shadow-corporate-hero transition-all duration-300 flex-1 flex flex-col">
              <CacheMetricsPanel isAdvancedMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
