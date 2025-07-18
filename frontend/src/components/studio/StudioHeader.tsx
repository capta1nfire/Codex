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

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudio } from './StudioProvider';
import { Button } from '@/components/ui/button';
import { 
  Save,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioWebSocket } from '@/hooks/useStudioWebSocket';

export function StudioHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isDirty, activeConfig, saveConfig, isLoading } = useStudio();
  
  // Estado de conexión WebSocket
  const { isConnected } = useStudioWebSocket();

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
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Título de la página actual */}
        <h1 className="text-xl font-semibold text-slate-900 flex-1">
          {getPageTitle()}
        </h1>

        {/* Acciones del header */}
        <div className="flex items-center gap-3">
          {/* Indicador de cambios sin guardar */}
          {isDirty && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-600 font-medium hidden sm:inline">
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
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          )}

          {/* Estado de conexión WebSocket */}
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isConnected 
              ? "bg-green-100 text-green-700" 
              : "bg-red-100 text-red-700"
          )}>
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Info del usuario */}
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
            {user?.firstName?.[0]?.toUpperCase() || 'S'}
          </div>
        </div>
      </div>
    </header>
  );
}