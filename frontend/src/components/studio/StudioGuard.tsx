/**
 * StudioGuard - Permission Guard Component for QR Studio
 * 
 * Componente guardia para proteger rutas y features de QR Studio
 * basado en permisos granulares.
 * 
 * @principle Pilar 1: Seguridad - Verificación estricta de permisos
 * @principle Pilar 2: Robustez - Manejo de estados de carga y error
 * @principle Pilar 3: Simplicidad - API declarativa y clara
 * @principle Pilar 4: Modularidad - Componente reutilizable
 * @principle Pilar 5: Valor - Feedback claro sobre permisos
 */

'use client';

import { ReactNode } from 'react';
import { useStudioPermissions, StudioAction } from '@/hooks/useStudioPermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldOff, 
  Lock, 
  AlertTriangle,
  Home,
  Crown
} from 'lucide-react';
import Link from 'next/link';

interface StudioGuardProps {
  children: ReactNode;
  // Permisos requeridos
  permission?: StudioAction;
  permissions?: StudioAction[];
  requireAll?: boolean; // Si true, requiere todos los permisos. Si false, requiere al menos uno
  
  // Personalización
  fallback?: ReactNode;
  showError?: boolean;
  redirectTo?: string;
  
  // Mensajes personalizados
  title?: string;
  description?: string;
}

export function StudioGuard({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback,
  showError = true,
  title = 'Acceso Restringido',
  description = 'No tienes permisos para acceder a esta funcionalidad.',
}: StudioGuardProps) {
  const { hasPermission, role, features } = useStudioPermissions();
  
  // Pilar 1: Validación estricta de permisos
  const allPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = allPermissions.length === 0 || (
    requireAll 
      ? allPermissions.every(p => hasPermission(p))
      : allPermissions.some(p => hasPermission(p))
  );
  
  // Si tiene acceso, mostrar contenido
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Si hay fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Si no debe mostrar error, no renderizar nada
  if (!showError) {
    return null;
  }
  
  // Pilar 5: Mensaje claro y útil sobre permisos
  return (
    <Card className="max-w-md mx-auto mt-8 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
          <ShieldOff className="h-6 w-6 text-orange-600" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="mt-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información sobre el rol actual */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Tu rol actual</AlertTitle>
          <AlertDescription className="text-amber-700">
            Estás conectado como <strong>{role || 'Usuario'}</strong>.
            {role !== 'SUPERADMIN' && (
              <span className="block mt-1">
                Contacta a un administrador si necesitas acceso adicional.
              </span>
            )}
          </AlertDescription>
        </Alert>
        
        {/* Sugerencia de upgrade para usuarios premium */}
        {role === 'USER' && (
          <Alert className="border-purple-200 bg-purple-50">
            <Crown className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">Actualiza tu cuenta</AlertTitle>
            <AlertDescription className="text-purple-700">
              Esta funcionalidad estará disponible para usuarios Premium próximamente.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Acciones */}
        <div className="flex gap-3">
          <Button asChild variant="default" className="flex-1">
            <Link href="/studio">
              <Home className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente wrapper para features específicas
interface StudioFeatureProps {
  children: ReactNode;
  feature: 'global' | 'placeholder' | 'templates' | 'effects' | 'permissions';
  fallback?: ReactNode;
}

export function StudioFeature({ children, feature, fallback }: StudioFeatureProps) {
  const permissionMap: Record<string, StudioAction> = {
    global: StudioAction.WRITE,
    placeholder: StudioAction.WRITE,
    templates: StudioAction.WRITE,
    effects: StudioAction.WRITE,
    permissions: StudioAction.WRITE,
  };
  
  const permission = permissionMap[feature];
  const featureNames: Record<string, string> = {
    global: 'Configuración Global',
    placeholder: 'Editor de Placeholder',
    templates: 'Gestión de Plantillas',
    effects: 'Editor de Efectos',
    permissions: 'Gestión de Permisos',
  };
  
  return (
    <StudioGuard
      permission={permission}
      fallback={fallback}
      title={`Acceso a ${featureNames[feature]}`}
      description={`No tienes permisos para editar ${featureNames[feature].toLowerCase()}.`}
    >
      {children}
    </StudioGuard>
  );
}

// Hook para usar en componentes
export function useStudioGuard(permission: StudioAction): boolean {
  const { hasPermission } = useStudioPermissions();
  return hasPermission(permission);
}