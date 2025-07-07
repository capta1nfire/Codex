/**
 * StudioHeader - Header Component for QR Studio
 * 
 * Header pegajoso con navegación responsive y acciones contextuales
 * 
 * @principle Pilar 1: Seguridad - Muestra información del usuario autenticado
 * @principle Pilar 2: Robustez - Manejo de estados y responsividad
 * @principle Pilar 3: Simplicidad - Interfaz limpia y clara
 * @principle Pilar 4: Modularidad - Componente independiente reutilizable
 * @principle Pilar 5: Valor - Acceso rápido a funciones principales
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useStudio } from './StudioProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  ArrowLeft,
  Save,
  RefreshCw,
  Settings,
  HelpCircle,
  Bell,
  Zap,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioSidebar } from './StudioSidebar';
import { useStudioWebSocket } from '@/hooks/useStudioWebSocket';

export function StudioHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDirty, activeConfig, saveConfig, isLoading } = useStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estado de conexión WebSocket
  const { isConnected, connectionStats } = useStudioWebSocket();

  // Determinar título basado en la ruta
  const getPageTitle = () => {
    if (pathname === '/studio') return 'Dashboard';
    if (pathname === '/studio/global') return 'Configuración Global';
    if (pathname === '/studio/placeholder') return 'Editor de Placeholder';
    if (pathname === '/studio/templates') return 'Plantillas';
    if (pathname === '/studio/effects') return 'Efectos y Estilos';
    if (pathname === '/studio/permissions') return 'Permisos';
    return 'QR Studio';
  };

  // Pilar 2: Manejo robusto del guardado
  const handleSave = async () => {
    if (!activeConfig || !isDirty) return;
    
    try {
      await saveConfig(activeConfig);
    } catch (error) {
      // El error ya es manejado por el provider con toast
      console.error('Error guardando configuración:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Botón de menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <StudioSidebar />
          </SheetContent>
        </Sheet>

        {/* Navegación breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-1">
          <Link
            href="/"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href="/studio"
            className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <Zap className="h-3 w-3" />
            Studio
          </Link>
          {pathname !== '/studio' && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-medium">
                {getPageTitle()}
              </span>
            </>
          )}
        </nav>

        {/* Acciones del header */}
        <div className="flex items-center gap-2">
          {/* Indicador de cambios sin guardar */}
          {isDirty && (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-600 font-medium">
                Cambios sin guardar
              </span>
            </div>
          )}

          {/* Botón de guardar */}
          {activeConfig && isDirty && (
            <Button
              onClick={handleSave}
              size="sm"
              disabled={isLoading}
              className={cn(
                "transition-all",
                isDirty && "animate-pulse"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          )}

          {/* Estado de conexión WebSocket */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isConnected 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            )}>
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>Sync</span>
                  {connectionStats.latency > 0 && (
                    <span className="text-green-600 opacity-70">
                      {connectionStats.latency}ms
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
            {isConnected && (
              <Activity className="h-3 w-3 text-green-600 animate-pulse" />
            )}
          </div>

          {/* Botón de recargar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="Recargar página"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Notificaciones (placeholder para futuro) */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {/* Badge de notificaciones */}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* Ayuda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('/docs/studio', '_blank')}
            title="Ayuda y documentación"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Separador */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {/* Info del usuario */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">SuperAdmin</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.[0]?.toUpperCase() || 'S'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}