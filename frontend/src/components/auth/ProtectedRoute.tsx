'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions, UserRole } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lock, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  requireAuth = true,
  fallbackPath = '/login',
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasRole, hasAnyRole, user } = usePermissions();

  // Si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    // En lugar de redireccionar automáticamente, mostrar mensaje
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg shadow-red-500/10 border-destructive/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>
              Debes iniciar sesión para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Ir al Inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si está autenticado pero no tiene el rol requerido
  if (isAuthenticated && user) {
    let hasRequiredPermission = true;

    if (requiredRole) {
      hasRequiredPermission = hasRole(requiredRole);
    } else if (requiredRoles && requiredRoles.length > 0) {
      hasRequiredPermission = hasAnyRole(requiredRoles);
    }

    if (!hasRequiredPermission) {
      if (!showAccessDenied) {
        // Redireccionar silenciosamente
        router.push(fallbackPath);
        return null;
      }

      // Mostrar mensaje de acceso denegado
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg shadow-orange-500/10 border-orange-500/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ShieldX className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle className="text-xl text-orange-600 dark:text-orange-400">
                Acceso Denegado
              </CardTitle>
              <CardDescription>
                No tienes permisos suficientes para acceder a esta página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      Rol requerido: {requiredRole || requiredRoles?.join(' o ')}
                    </p>
                    <p className="text-orange-600 dark:text-orange-400 mt-1">
                      Tu rol actual: {user.role}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard">Ir al Dashboard</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">Ir al Inicio</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Usuario autenticado y con permisos correctos
  return <>{children}</>;
} 