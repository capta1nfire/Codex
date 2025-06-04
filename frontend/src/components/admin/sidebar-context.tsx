'use client';

import { createContext, useContext } from 'react';

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
    throw new Error('useSidebar must be used within AppLayout');
  }
  return context;
};

export { SidebarContext };
export type { SidebarContextType }; 