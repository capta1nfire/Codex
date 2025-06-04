'use client';

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
  Crown,
  LogIn,
  UserPlus,
  FileText,
  Key
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import ProfilePicture from '../ui/ProfilePicture';
import RoleBadge from '../ui/RoleBadge';
import { usePermissions } from '@/hooks/useAuth';
import { useSidebar } from './sidebar-context';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
  requiredRoles?: string[];
  isExternal?: boolean;
}

const menuItems: MenuItem[] = [
  // Core - Disponible para todos
  {
    href: '/',
    label: 'Generador',
    icon: <Home className="h-5 w-5" />,
    category: 'Core',
    description: 'Crear códigos de barras'
  },
  {
    href: 'http://localhost:3004/api-docs/',
    label: 'API Docs',
    icon: <FileText className="h-5 w-5" />,
    category: 'Core',
    description: 'Documentación de API',
    isExternal: true
  },
  
  // Personal - Solo usuarios autenticados
  {
    href: '/profile',
    label: 'Mi Perfil',
    icon: <User className="h-5 w-5" />,
    category: 'Personal',
    description: 'Configuración personal',
    requiredRoles: ['STARTER', 'PRO', 'ENTERPRISE', 'ADMIN', 'SUPERADMIN']
  },
  {
    href: '/security',
    label: 'Security Center',
    icon: <Shield className="h-5 w-5" />,
    category: 'Personal',
    description: 'Gestionar seguridad',
    requiredRoles: ['STARTER', 'PRO', 'ENTERPRISE', 'ADMIN', 'SUPERADMIN']
  },
  
  // Dashboard - Solo para usuarios con suscripción
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <BarChart2 className="h-5 w-5" />,
    category: 'Analytics',
    description: 'Panel de control',
    requiredRoles: ['STARTER', 'PRO', 'ENTERPRISE', 'ADMIN', 'SUPERADMIN']
  },
  
  // Sistema - Solo SUPERADMIN
  {
    href: '/system-status',
    label: 'Estado del Sistema',
    icon: <Activity className="h-5 w-5" />,
    category: 'Sistema',
    description: 'Control de servicios',
    requiredRoles: ['SUPERADMIN']
  },
  {
    href: '/cache-metrics',
    label: 'Métricas de Cache',
    icon: <Database className="h-5 w-5" />,
    category: 'Sistema',
    description: 'Administración de cachés',
    requiredRoles: ['SUPERADMIN']
  },
  
  // Administración
  {
    href: '/webadmin/users',
    label: 'Gestión de Usuarios',
    icon: <Users className="h-5 w-5" />,
    category: 'Administración',
    description: 'Administrar usuarios',
    requiredRoles: ['ADMIN', 'SUPERADMIN']
  },
  {
    href: '/webadmin/dashboard',
    label: 'Dashboard WebAdmin',
    icon: <BarChart2 className="h-5 w-5" />,
    category: 'Administración',
    description: 'Monitoreo administrativo',
    requiredRoles: ['ADMIN', 'SUPERADMIN']
  },
  {
    href: '/webadmin/settings',
    label: 'Configuración Sistema',
    icon: <Settings className="h-5 w-5" />,
    category: 'Administración',
    description: 'Ajustes globales',
    requiredRoles: ['ADMIN', 'SUPERADMIN']
  },
  
  // Herramientas
  {
    href: '/production-readiness',
    label: 'Production Readiness',
    icon: <Shield className="h-5 w-5" />,
    category: 'Herramientas',
    description: 'Validación para producción',
    requiredRoles: ['ADMIN', 'SUPERADMIN']
  }
];

export default function AppSidebar() {
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { userRole } = usePermissions();

  const handleLogout = () => {
    logout();
  };

  // Filtrar items según rol del usuario
  const getVisibleItems = () => {
    return menuItems.filter(item => {
      if (!item.requiredRoles) return true; // Items públicos
      if (!isAuthenticated) return false; // Requiere autenticación
      return item.requiredRoles.includes(userRole || '');
    });
  };

  const visibleItems = getVisibleItems();
  const groupedItems = visibleItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* CODEX Logo & Brand */}
      <div className="p-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {/* Logo */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-corporate-blue-600 to-corporate-blue-700 shadow-lg">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="font-bold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                CODEX
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Barcode Generator
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-border/50">
        {isAuthenticated && user ? (
          <div className="space-y-3">
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
            
            {/* Collapsed state */}
            {isCollapsed && (
              <Link
                href="/profile"
                className={cn(
                  "flex items-center justify-center p-3 rounded-lg transition-all duration-200",
                  "hover:bg-slate-100 hover:shadow-sm dark:hover:bg-slate-800/50",
                  "cursor-pointer group border border-slate-200/50 dark:border-slate-700/50",
                  "hover:border-slate-300 dark:hover:border-slate-600"
                )}
                title={`${user.firstName} ${user.lastName} - ${userRole}`}
              >
                <ProfilePicture user={user} size="xs" />
              </Link>
            )}
          </div>
        ) : (
          // Auth options for non-authenticated users
          <div className="space-y-2">
            {!isCollapsed ? (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                    "bg-corporate-blue-600 hover:bg-corporate-blue-700",
                    "text-white shadow-lg hover:shadow-xl"
                  )}
                >
                  <LogIn className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">Iniciar Sesión</div>
                    <div className="text-xs opacity-90">Accede a tu cuenta</div>
                  </div>
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                    "border-2 border-corporate-blue-200 hover:border-corporate-blue-300",
                    "hover:bg-corporate-blue-50 text-corporate-blue-700"
                  )}
                >
                  <UserPlus className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">Registrarse</div>
                    <div className="text-xs opacity-75">Crear cuenta gratis</div>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center p-3 rounded-lg bg-corporate-blue-600 hover:bg-corporate-blue-700 text-white transition-all duration-200"
                  title="Iniciar Sesión"
                >
                  <LogIn className="h-5 w-5" />
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center p-3 rounded-lg border-2 border-corporate-blue-200 hover:border-corporate-blue-300 hover:bg-corporate-blue-50 text-corporate-blue-700 transition-all duration-200"
                  title="Registrarse"
                >
                  <UserPlus className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-6">
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
                    {item.isExternal ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                          "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50",
                          "text-slate-700 dark:text-slate-300"
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
                      </a>
                    ) : (
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
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer - Logout (solo para usuarios autenticados) */}
      {isAuthenticated && (
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
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden inline-flex items-center justify-center p-2 rounded-md bg-white/95 backdrop-blur-sm border border-border/50 shadow-lg"
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
          "hidden lg:flex fixed left-0 top-0 bg-white/95 backdrop-blur-sm border-r border-border/50 shadow-lg z-40 transition-all duration-300",
          "h-screen", // Altura completa de la pantalla
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
          "fixed left-0 top-0 w-72 bg-white/95 backdrop-blur-sm border-r border-border/50 shadow-lg z-50 lg:hidden transition-transform duration-300",
          "h-screen", // Altura completa de la pantalla
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
} 