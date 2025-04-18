"use client";

import { useState, useEffect } from 'react';
import SystemStatus from '@/components/SystemStatus';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Dashboard del Sistema
      </h1>
      
      <div className="w-full max-w-5xl">
        <SystemStatus />
      </div>
    </main>
  );
} 