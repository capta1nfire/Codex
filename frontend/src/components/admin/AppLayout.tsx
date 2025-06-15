'use client';

import { useState } from 'react';
import AppSidebar from './AppSidebar';
import { cn } from '@/lib/utils';
import { SidebarContext } from './sidebar-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true); // Cambiado a true para iniciar contraído
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Sidebar universal - disponible para todos los usuarios
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {/* Universal App Sidebar */}
      <AppSidebar />
      
      {/* Main Content Area with dynamic sidebar offset */}
      <div 
        className={cn(
          "transition-all duration-300 ease-smooth min-h-screen",
          // Desktop: Ajustar margen dinámicamente según el estado del sidebar
          isCollapsed ? "lg:ml-16" : "lg:ml-72", // w-16 = 64px collapsed, w-72 = 288px expanded
          // Mobile: Sin margen
          "ml-0",
          // Importante: no restringir overflow para permitir sticky
          "overflow-visible"
        )}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
} 