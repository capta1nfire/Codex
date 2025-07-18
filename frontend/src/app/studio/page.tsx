/**
 * QR Studio - SuperAdmin Dashboard
 * 
 * Panel de control exclusivo para SuperAdmin para gestionar configuraciones
 * globales de QR, plantillas y placeholders. Preparado para extensión Premium.
 * 
 * @security Solo accesible para rol SUPERADMIN
 * @principle Pilar 1: Seguridad por defecto - Validación estricta de permisos
 * @principle Pilar 2: Código robusto - Manejo de estados de carga y error
 * @principle Pilar 3: Simplicidad - Interfaz clara y directa
 * @principle Pilar 4: Modularidad - Componentes reutilizables
 * @principle Pilar 5: Valor del usuario - Control total para SuperAdmin
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStudio } from '@/components/studio/StudioProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Settings, 
  Palette, 
  FileText, 
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { StudioAccordion } from '@/components/studio/StudioAccordion';

export default function StudioPage() {
  const { user, loading: authLoading } = useAuth();
  const { configs, isLoading: studioLoading, error, loadConfigs } = useStudio();
  const router = useRouter();

  useEffect(() => {
    // Pilar 1: Seguridad - Validación estricta de permisos
    if (!authLoading && (!user || user.role !== 'SUPERADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Pilar 2: Código robusto - Manejo de múltiples estados
  if (authLoading || studioLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-slate-600">Cargando QR Studio...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'SUPERADMIN') {
    return null;
  }

  // Pilar 2: Manejo de errores con feedback útil
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar configuraciones</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => loadConfigs()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Calcular estadísticas
  const stats = {
    total: configs.length,
    global: configs.filter(c => c.type === 'GLOBAL').length,
    templates: configs.filter(c => c.type === 'TEMPLATE').length,
    placeholder: configs.filter(c => c.type === 'PLACEHOLDER').length,
  };

  return (
    <div className="space-y-6">
      {/* Header con información del usuario */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">QR Studio</h1>
          <p className="text-slate-600 mt-1">
            Panel de control avanzado para configuración de QR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            SuperAdmin
          </Badge>
          <Button 
            onClick={() => loadConfigs()} 
            variant="outline" 
            size="sm"
            disabled={studioLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${studioLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas informativas */}
      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Modo SuperAdmin Activo</AlertTitle>
        <AlertDescription className="text-blue-700">
          Los cambios realizados aquí afectan a todos los usuarios de la plataforma. 
          Las configuraciones se aplican en tiempo real.
        </AlertDescription>
      </Alert>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Configs</CardTitle>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-500">Configuraciones activas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global</CardTitle>
            <Settings className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.global}</div>
            <p className="text-xs text-slate-500">Config base</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.templates}</div>
            <p className="text-xs text-slate-500">Por dominio</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Placeholder</CardTitle>
            <Palette className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.placeholder}</div>
            <p className="text-xs text-slate-500">QR ejemplo</p>
          </CardContent>
        </Card>
      </div>

      {/* Nueva navegación con acordeón */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Panel de navegación principal */}
        <div className="lg:col-span-2">
          <StudioAccordion />
        </div>
        
        {/* Panel lateral con información adicional */}
        <div className="space-y-6">
          {/* Estado del sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-slate-600" />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Configuraciones activas:</span>
                <Badge variant="default">{stats.total}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Configuración global:</span>
                {stats.global > 0 ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Placeholder:</span>
                {stats.placeholder > 0 ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Personalizado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Por defecto</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Acciones rápidas adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-amber-600" />
                Herramientas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/">
                  <Palette className="h-4 w-4 mr-2" />
                  Ver página principal
                </Link>
              </Button>
              <Button 
                onClick={() => loadConfigs()} 
                variant="outline" 
                className="w-full justify-start"
                disabled={studioLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${studioLoading ? 'animate-spin' : ''}`} />
                Recargar configuraciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-600" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Últimos cambios en configuraciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length > 0 ? (
            <div className="space-y-3">
              {configs.slice(0, 5).map((config) => (
                <div key={config.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{config.name}</p>
                    <p className="text-xs text-slate-500">
                      {config.type} • Actualizado: {new Date(config.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    v{config.version}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              No hay configuraciones activas aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}