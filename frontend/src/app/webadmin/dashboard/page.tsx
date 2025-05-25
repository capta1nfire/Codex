'use client';

import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';
import CacheMetricsPanel from '@/components/CacheMetricsPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WebAdminDashboardPage() {
  return (
    <ProtectedRoute requiredRoles={["WEBADMIN", "SUPERADMIN"]}>
      <WebAdminDashboardContent />
    </ProtectedRoute>
  );
}

function WebAdminDashboardContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header - WebAdmin Theme */}
      <div className="bg-gradient-to-r from-red-50/50 via-slate-50/50 to-red-50/50 dark:from-red-950/20 dark:via-slate-950/20 dark:to-red-950/20 border-b border-red-200/30 dark:border-red-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Dashboard WebAdmin
              </h1>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1 font-medium">
                Administración técnica y monitoreo del sistema CODEX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content - 3 columns with equal height */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: System Status */}
          <div className="h-full">
            <SystemStatus isAdvancedMode={false} />
          </div>

          {/* Column 2: Cache Metrics */}
          <div className="h-full">
            <CacheMetricsPanel isAdvancedMode={false} />
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