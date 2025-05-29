'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WebAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al dashboard de WebAdmin
    router.push('/webadmin/dashboard');
  }, [router]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirigiendo al Dashboard WebAdmin...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
} 