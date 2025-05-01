'use client';

// import { useState, useEffect } from 'react'; // Remove unused imports
import SystemStatus from '@/components/SystemStatus';
import RustAnalyticsDisplay from '@/components/RustAnalyticsDisplay';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Dashboard del Sistema</h1>

      <div className="w-full max-w-5xl space-y-6">
        <SystemStatus />
        <RustAnalyticsDisplay />
      </div>
    </main>
  );
}
