'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart2, 
  Activity, 
  Database, 
  Users, 
  Settings, 
  Shield, 
  User, 
  LogOut, 
  Zap,
  Menu,
  X,
  ChevronRight,
  Home,
  Crown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import ProfilePicture from '../ui/ProfilePicture';
import RoleBadge from '../ui/RoleBadge';
import { usePermissions } from '@/hooks/useAuth';
import { useSidebar } from './SuperAdminLayout';

interface AdminMenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
}

const adminMenuItems: AdminMenuItem[] = [
  // Sistema
  {
    href: '/dashboard',
    label: 'Dashboard Principal',
    icon: <BarChart2 className="h-5 w-5" />,
    category: 'Sistema',
    description: 'Panel de control principal'
  },
  {
    href: '/system-status',
    label: 'Estado del Sistema',
    icon: <Activity className="h-5 w-5" />,
    category: 'Sistema',
    description: 'Control de servicios y métricas'
  },
  {
    href: '/cache-metrics',
    label: 'Métricas de Cache',
    icon: <Database className="h-5 w-5" />,
    category: 'Sistema',
    description: 'Administración de cachés'
  },
  
  // Administración
  {
    href: '/webadmin/users',
    label: 'Gestión de Usuarios',
    icon: <Users className="h-5 w-5" />,
    category: 'Administración',
    description: 'Administrar usuarios del sistema'
  },
  {
    href: '/webadmin/dashboard',
    label: 'Dashboard WebAdmin',
    icon: <BarChart2 className="h-5 w-5" />,
    category: 'Administración',
    description: 'Monitoreo administrativo'
  },
  {
    href: '/webadmin/settings',
    label: 'Configuración Sistema',
    icon: <Settings className="h-5 w-5" />,
    category: 'Administración',
    description: 'Ajustes globales del sistema'
  },
  
  // Herramientas
  {
    href: '/production-readiness',
    label: 'Production Readiness',
    icon: <Shield className="h-5 w-5" />,
    category: 'Herramientas',
    description: 'Validación para producción'
  },
  
  // Personal
  {
    href: '/profile',
    label: 'Mi Perfil',
    icon: <User className="h-5 w-5" />,
    category: 'Personal',
    description: 'Configuración personal'
  }
];

export default function SuperAdminSidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { userRole } = usePermissions();

  const handleLogout = () => {
    logout();
  };

  const groupedItems = adminMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, AdminMenuItem[]>);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Merged Header + User Info */}
      <div className="p-4 border-b border-border/50">
        {user ? (
          <div className="space-y-3">
            {/* Main Title */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide">
                  Panel de Control
                </h2>
              )}
            </div>
            
            {/* User Info Card */}
            {!isCollapsed && (
              <Link
                href="/profile"
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                  "hover:bg-blue-50 hover:shadow-sm dark:hover:bg-blue-950/30",
                  "cursor-pointer group border border-border/30 hover:border-blue-200 dark:hover:border-blue-700"
                )}
                title="Ver mi perfil"
              >
                <ProfilePicture user={user} size="sm" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center justify-between">
                    <RoleBadge role={userRole as any} variant="sidebar" />
                  </div>
                </div>
              </Link>
            )}
            
            {/* Collapsed state - show role icon instead of profile picture */}
            {isCollapsed && (
              <Link
                href="/profile"
                className={cn(
                  "flex items-center justify-center p-3 rounded-lg transition-all duration-200",
                  "hover:bg-slate-100 hover:shadow-sm dark:hover:bg-slate-800/50",
                  "cursor-pointer group border border-slate-200/50 dark:border-slate-700/50",
                  "hover:border-slate-300 dark:hover:border-slate-600"
                )}
                title={`${user.firstName} ${user.lastName} - Super Admin`}
              >
                {/* Role Badge Icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors duration-200">
                  <Crown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                </div>
              </Link>
            )}
          </div>
        ) : (
          // Fallback if no user
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
              <Zap className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">Super Admin</h2>
                <p className="text-xs text-slate-500">Panel de Control</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-6">
          {/* Quick Access - Home */}
          <div>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50",
                pathname === '/' 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" 
                  : "text-slate-700 dark:text-slate-300"
              )}
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="font-medium">Generador</div>
                  <div className="text-xs opacity-75">Página principal</div>
                </div>
              )}
            </Link>
          </div>

          {/* Menu Categories */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {category}
                </h3>
              )}
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                        "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50",
                        pathname === item.href 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" 
                          : "text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-xs opacity-75 truncate">{item.description}</div>
                          )}
                        </div>
                      )}
                      {isCollapsed && (
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-border/50">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200",
            "hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50",
            "text-slate-700 dark:text-slate-300"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <div className="font-medium">Cerrar Sesión</div>
              <div className="text-xs opacity-75">Salir del sistema</div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-20 left-4 z-50 lg:hidden inline-flex items-center justify-center p-2 rounded-md bg-white/95 backdrop-blur-sm border border-border/50 shadow-lg"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 bg-white/95 backdrop-blur-sm border-r border-border/50 shadow-lg z-40 transition-all duration-300",
          "top-16 lg:top-20 xl:top-24", // Empezar después del navbar
          "h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] xl:h-[calc(100vh-6rem)]", // Altura ajustada
          isCollapsed ? "w-16" : "w-72"
        )}
      >
        <div className="flex flex-col w-full">
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-white border border-border/50 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", isCollapsed ? "rotate-0" : "rotate-180")} />
          </button>
          
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed left-0 w-72 bg-white/95 backdrop-blur-sm border-r border-border/50 shadow-lg z-50 lg:hidden transition-transform duration-300",
          "top-16 lg:top-20 xl:top-24", // Empezar después del navbar
          "h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] xl:h-[calc(100vh-6rem)]", // Altura ajustada
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
} 