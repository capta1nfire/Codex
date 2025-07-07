/**
 * QR Studio Layout
 * 
 * Layout principal para QR Studio con navegación interna y protección de permisos
 * 
 * @principle Pilar 1: Seguridad - Validación de permisos en cada renderizado
 * @principle Pilar 2: Robustez - Estados de carga y error manejados
 * @principle Pilar 3: Simplicidad - Estructura clara con sidebar y contenido
 * @principle Pilar 4: Modularidad - Componentes independientes
 * @principle Pilar 5: Valor - Experiencia fluida con transiciones suaves
 */

'use client';

import { useEffect, ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StudioProvider } from '@/components/studio/StudioProvider';
import { StudioSidebar } from '@/components/studio/StudioSidebar';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  AlertTriangle,
  Home,
  ShieldOff
} from 'lucide-react';
import Link from 'next/link';

interface StudioLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Pilar 1: Seguridad - Validación estricta en cada cambio
    if (!loading) {
      const authorized = user && user.role === 'SUPERADMIN';
      setIsAuthorized(authorized);
      
      if (!authorized) {
        // Pequeño delay para evitar flash de contenido
        const timer = setTimeout(() => {
          router.push('/');
        }, 100);
        return () => clearTimeout(timer);
      }
      
      // Marcar carga inicial como completa
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    }
  }, [user, loading, router, isInitialLoad]);

  // Pilar 2: Manejo robusto de estados de carga
  if (loading || isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 bg-blue-200 rounded-full animate-ping opacity-75" />
            </div>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4 relative z-10" />
          </div>
          <p className="text-sm text-slate-600 mt-4 font-medium">
            Cargando QR Studio...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verificando permisos de SuperAdmin
          </p>
        </div>
      </div>
    );
  }

  // Pilar 1: Mensaje claro cuando no hay permisos
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="max-w-md w-full mx-auto p-6">
          <Alert variant="destructive" className="shadow-lg">
            <ShieldOff className="h-5 w-5" />
            <AlertTitle className="text-lg">Acceso Denegado</AlertTitle>
            <AlertDescription className="mt-2">
              Esta sección requiere permisos de SuperAdmin.
              Por favor, contacta al administrador si necesitas acceso.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="default" className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pilar 5: Valor - Interfaz fluida con animaciones suaves
  return (
    <StudioProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Sidebar con animación */}
        <div className="hidden lg:block">
          <StudioSidebar />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header pegajoso */}
          <StudioHeader />
          
          {/* Área de contenido con animación de entrada */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div 
              key={pathname}
              className="animate-in slide-in-from-right-5 duration-300 ease-out"
            >
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>
          
          {/* Footer con información de contexto */}
          <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span>QR Studio v1.0.0</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Usuario: {user?.email}</span>
                  <span>•</span>
                  <span>Rol: SuperAdmin</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </StudioProvider>
  );
}