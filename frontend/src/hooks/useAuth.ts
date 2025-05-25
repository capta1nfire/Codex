// Re-export del hook useAuth desde AuthContext para compatibilidad
export { useAuth } from '@/context/AuthContext';

// Hook personalizado para verificación de roles y permisos
import { useAuth as useAuthContext } from '@/context/AuthContext';

export type UserRole = 'USER' | 'PREMIUM' | 'ADVANCED' | 'WEBADMIN' | 'SUPERADMIN';

export interface RolePermissions {
  // Permisos para usuarios clientes (generación de códigos)
  canGenerateCodes: boolean;
  canAccessUserDashboard: boolean;
  canAccessAdvancedOptions: boolean;
  canAccessPremiumFeatures: boolean;
  canAccessExpertFeatures: boolean;
  
  // Permisos para administración del sitio web (WEBADMIN y SUPERADMIN)
  canAccessWebAdminPanel: boolean;
  canViewSystemMetrics: boolean;
  canManageUsers: boolean;
  canModifySystemSettings: boolean;
  canViewServerLogs: boolean;
  
  // Permisos exclusivos de SUPERADMIN
  canManageAdministrators: boolean;
  canAccessSuperAdminPanel: boolean;
  canModifyGlobalSettings: boolean;
}

export function usePermissions() {
  const { user, isAuthenticated } = useAuthContext();
  
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const userRole = user.role.toUpperCase();
    
    // SUPERADMIN tiene acceso absoluto a todo
    if (userRole === 'SUPERADMIN') return true;
    
    // WEBADMIN tiene acceso a todo excepto funciones de SUPERADMIN
    if (userRole === 'WEBADMIN' && requiredRole !== 'SUPERADMIN') return true;
    
    // Verificación exacta de roles
    if (userRole === requiredRole) return true;
    
    // Jerarquía de roles para usuarios clientes:
    if (requiredRole === 'USER') {
      return ['USER', 'PREMIUM', 'ADVANCED'].includes(userRole);
    }
    
    if (requiredRole === 'PREMIUM') {
      return ['PREMIUM', 'ADVANCED'].includes(userRole);
    }
    
    return false;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const getRoleName = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Super Admin';
      case 'WEBADMIN':
        return 'Admin';
      case 'ADVANCED':
        return 'Enterprise';
      case 'PREMIUM':
        return 'PRO';
      case 'USER':
        return 'Freemium';
      default:
        return 'Freemium';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'text-red-600 dark:text-red-400';
      case 'WEBADMIN':
        return 'text-orange-600 dark:text-orange-400';
      case 'ADVANCED':
        return 'text-amber-600 dark:text-amber-400';
      case 'PREMIUM':
        return 'text-purple-600 dark:text-purple-400';
      case 'USER':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const permissions: RolePermissions = {
    // Permisos para usuarios clientes (generación de códigos)
    canGenerateCodes: hasAnyRole(['USER', 'PREMIUM', 'ADVANCED']),
    canAccessUserDashboard: hasAnyRole(['USER', 'PREMIUM', 'ADVANCED']),
    canAccessAdvancedOptions: hasAnyRole(['PREMIUM', 'ADVANCED']),
    canAccessPremiumFeatures: hasAnyRole(['PREMIUM', 'ADVANCED']),
    canAccessExpertFeatures: hasRole('ADVANCED'),
    
    // Permisos para administración del sitio web (WEBADMIN y SUPERADMIN)
    canAccessWebAdminPanel: hasAnyRole(['WEBADMIN', 'SUPERADMIN']),
    canViewSystemMetrics: hasAnyRole(['WEBADMIN', 'SUPERADMIN']),
    canManageUsers: hasAnyRole(['WEBADMIN', 'SUPERADMIN']),
    canModifySystemSettings: hasAnyRole(['WEBADMIN', 'SUPERADMIN']),
    canViewServerLogs: hasAnyRole(['WEBADMIN', 'SUPERADMIN']),
    
    // Permisos exclusivos de SUPERADMIN
    canManageAdministrators: hasRole('SUPERADMIN'),
    canAccessSuperAdminPanel: hasRole('SUPERADMIN'),
    canModifyGlobalSettings: hasRole('SUPERADMIN'),
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    permissions,
    userRole: user?.role?.toUpperCase() as UserRole || null,
    getRoleName,
    getRoleColor,
    isSuperAdmin: hasRole('SUPERADMIN'),
    isWebAdmin: hasRole('WEBADMIN'),
    isAdvanced: hasRole('ADVANCED'),
    isPremium: hasRole('PREMIUM'),
    isUser: hasRole('USER'),
  };
} 