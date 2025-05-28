'use client';

import { useState, createContext, useContext } from 'react';
import { usePermissions } from '@/hooks/useAuth';
import SuperAdminSidebar from './SuperAdminSidebar';
import { cn } from '@/lib/utils';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

// Context para compartir el estado del sidebar
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SuperAdminLayout');
  }
  return context;
};

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { userRole } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Solo aplicar el layout de Super Admin si el usuario es SUPERADMIN
  if (userRole !== 'SUPERADMIN') {
    return <>{children}</>;
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar />
      
      {/* Main Content Area with dynamic sidebar offset */}
      <div 
        className={cn(
          "transition-all duration-300 ease-smooth",
          // Desktop: Ajustar margen dinámicamente según el estado del sidebar
          isCollapsed ? "lg:ml-16" : "lg:ml-72", // w-16 = 64px collapsed, w-72 = 288px expanded
          // Mobile: Sin margen
          "ml-0"
        )}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
} 