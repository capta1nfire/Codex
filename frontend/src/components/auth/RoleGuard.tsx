'use client';

import React from 'react';
import { usePermissions, UserRole } from '@/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  inverse?: boolean; // Si true, muestra el contenido cuando NO tiene el rol
}

/**
 * Componente para mostrar/ocultar contenido basado en roles de usuario
 * 
 * @param children - Contenido a mostrar si el usuario tiene permisos
 * @param requiredRole - Rol específico requerido
 * @param requiredRoles - Array de roles alternativos (OR logic)
 * @param requireAuth - Si requiere estar autenticado (default: true)
 * @param fallback - Contenido alternativo a mostrar si no tiene permisos
 * @param inverse - Si true, muestra cuando NO tiene el rol especificado
 */
export default function RoleGuard({
  children,
  requiredRole,
  requiredRoles,
  requireAuth = true,
  fallback = null,
  inverse = false,
}: RoleGuardProps) {
  const { isAuthenticated, hasRole, hasAnyRole } = usePermissions();

  // Si requiere autenticación y no está autenticado
  if (requireAuth && !isAuthenticated) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  // Verificar permisos
  let hasPermission = true;

  if (requiredRole) {
    hasPermission = hasRole(requiredRole);
  } else if (requiredRoles && requiredRoles.length > 0) {
    hasPermission = hasAnyRole(requiredRoles);
  }

  // Aplicar lógica inversa si está habilitada
  if (inverse) {
    hasPermission = !hasPermission;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Componentes de conveniencia para roles específicos
export function SuperAdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="SUPERADMIN" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function WebAdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['WEBADMIN', 'SUPERADMIN']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AdvancedOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="ADVANCED" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PremiumOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requiredRoles={['PREMIUM', 'ADVANCED']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AuthenticatedOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireAuth={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function GuestOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireAuth={true} inverse={true} fallback={fallback}>
      {children}
    </RoleGuard>
  );
} 