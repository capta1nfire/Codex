'use client';

import { usePermissions } from '@/hooks/useAuth';
import SuperAdminSidebar from './SuperAdminSidebar';
import { cn } from '@/lib/utils';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { userRole } = usePermissions();
  
  // Solo aplicar el layout de Super Admin si el usuario es SUPERADMIN
  if (userRole !== 'SUPERADMIN') {
    return <>{children}</>;
  }

  return (
    <>
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar />
      
      {/* Main Content Area with sidebar offset */}
      <div 
        className={cn(
          "transition-all duration-300",
          // Desktop: Ajustar margen según el sidebar (w-72 = 288px, w-16 = 64px)
          "lg:ml-72", // Margen para sidebar expandido
          // Mobile: Sin margen
          "lg:pl-0"
        )}
      >
        {children}
      </div>
    </>
  );
} 