// Re-export del hook useAuth desde AuthContext para compatibilidad
export { useAuth } from '@/context/AuthContext';

// Hook personalizado para verificación de roles y permisos
import { useAuth as useAuthContext } from '@/context/AuthContext';

export type UserRole = 'STARTER' | 'PRO' | 'ENTERPRISE' | 'ADMIN' | 'SUPERADMIN';

export interface RolePermissions {
  // Permisos para usuarios clientes (generación de códigos)
  canGenerateCodes: boolean;
  canAccessUserDashboard: boolean;
  canAccessAdvancedOptions: boolean;
  canAccessPremiumFeatures: boolean;
  canAccessExpertFeatures: boolean;
  
  // Permisos para administración del sitio web (ADMIN y SUPERADMIN)
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
    
    // Mapeo de roles antiguos a nuevos para compatibilidad
    const mapOldToNewRole = (role: string): UserRole => {
      const upperRole = role.toUpperCase();
      switch (upperRole) {
        case 'USER': return 'STARTER';
        case 'PREMIUM': return 'ENTERPRISE';
        case 'ADVANCED': return 'PRO';
        case 'WEBADMIN': return 'ADMIN';
        case 'SUPERADMIN': return 'SUPERADMIN';
        default: return 'STARTER';
      }
    };
    
    const userRole = mapOldToNewRole(user.role);
    
    // SUPERADMIN tiene acceso absoluto a todo
    if (userRole === 'SUPERADMIN') return true;
    
    // ADMIN tiene acceso a todo excepto funciones de SUPERADMIN
    if (userRole === 'ADMIN' && requiredRole !== 'SUPERADMIN') return true;
    
    // Verificación exacta de roles
    if (userRole === requiredRole) return true;
    
    // Jerarquía de roles para usuarios clientes:
    if (requiredRole === 'STARTER') {
      return ['STARTER', 'PRO', 'ENTERPRISE'].includes(userRole);
    }
    
    if (requiredRole === 'PRO') {
      return ['PRO', 'ENTERPRISE'].includes(userRole);
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
      case 'ADMIN':
        return 'Admin';
      case 'ENTERPRISE':
        return 'Enterprise';
      case 'PRO':
        return 'Pro';
      case 'STARTER':
        return 'Starter';
      default:
        return 'Starter';
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'text-yellow-600 dark:text-yellow-400'; // Dorado para corona
      case 'ADMIN':
        return 'text-blue-600 dark:text-blue-400'; // Azul corporativo
      case 'ENTERPRISE':
        return 'text-slate-800 dark:text-slate-300'; // Negro/Platino premium
      case 'PRO':
        return 'text-purple-600 dark:text-purple-400'; // Púrpura profesional
      case 'STARTER':
        return 'text-green-600 dark:text-green-400'; // Verde crecimiento
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const permissions: RolePermissions = {
    // Permisos para usuarios clientes (generación de códigos)
    canGenerateCodes: hasAnyRole(['STARTER', 'PRO', 'ENTERPRISE']),
    canAccessUserDashboard: hasAnyRole(['STARTER', 'PRO', 'ENTERPRISE']),
    canAccessAdvancedOptions: hasAnyRole(['PRO', 'ENTERPRISE']),
    canAccessPremiumFeatures: hasAnyRole(['PRO', 'ENTERPRISE']),
    canAccessExpertFeatures: hasRole('ENTERPRISE'),
    
    // Permisos para administración del sitio web (ADMIN y SUPERADMIN)
    canAccessWebAdminPanel: hasAnyRole(['ADMIN', 'SUPERADMIN']),
    canViewSystemMetrics: hasAnyRole(['ADMIN', 'SUPERADMIN']),
    canManageUsers: hasAnyRole(['ADMIN', 'SUPERADMIN']),
    canModifySystemSettings: hasAnyRole(['ADMIN', 'SUPERADMIN']),
    canViewServerLogs: hasAnyRole(['ADMIN', 'SUPERADMIN']),
    
    // Permisos exclusivos de SUPERADMIN
    canManageAdministrators: hasRole('SUPERADMIN'),
    canAccessSuperAdminPanel: hasRole('SUPERADMIN'),
    canModifyGlobalSettings: hasRole('SUPERADMIN'),
  };

  // Mapear rol del usuario para compatibilidad
  const mapOldToNewRole = (role: string): UserRole => {
    const upperRole = role.toUpperCase();
    switch (upperRole) {
      case 'USER': return 'STARTER';
      case 'PREMIUM': return 'ENTERPRISE';
      case 'ADVANCED': return 'PRO';
      case 'WEBADMIN': return 'ADMIN';
      case 'SUPERADMIN': return 'SUPERADMIN';
      default: return 'STARTER';
    }
  };

  const currentUserRole = user ? mapOldToNewRole(user.role) : null;

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    permissions,
    userRole: currentUserRole,
    getRoleName,
    getRoleColor,
    isSuperAdmin: hasRole('SUPERADMIN'),
    isAdmin: hasRole('ADMIN'),
    isEnterprise: hasRole('ENTERPRISE'),
    isPro: hasRole('PRO'),
    isStarter: hasRole('STARTER'),
    // Mantener compatibilidad con nombres antiguos (deprecated)
    isWebAdmin: hasRole('ADMIN'),
    isAdvanced: hasRole('PRO'),
    isPremium: hasRole('ENTERPRISE'),
    isUser: hasRole('STARTER'),
  };
} 