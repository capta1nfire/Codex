/**
 * Hook para gestionar permisos de Studio en el frontend
 * 
 * Proporciona acceso fácil a los permisos del usuario actual
 * y funciones de utilidad para verificación de permisos
 */

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/hooks/useAuth';

export enum StudioAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  RESET = 'reset',
  APPLY_ALL = 'apply_all',
  EXPORT = 'export',
  IMPORT = 'import',
}

type PermissionMatrix = {
  [key in UserRole]?: {
    [key in StudioAction]?: boolean;
  };
};

// Misma matriz que en el backend
const studioPermissions: PermissionMatrix = {
  ['SUPERADMIN']: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: true,
    [StudioAction.DELETE]: true,
    [StudioAction.RESET]: true,
    [StudioAction.APPLY_ALL]: true,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: true,
  },
  ['WEBADMIN']: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: true,
    [StudioAction.DELETE]: true,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: true,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  ['ADVANCED']: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: false,
    [StudioAction.DELETE]: false,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  ['PREMIUM']: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: false,
    [StudioAction.DELETE]: false,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  ['USER']: {
    [StudioAction.READ]: false,
    [StudioAction.WRITE]: false,
    [StudioAction.DELETE]: false,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: false,
    [StudioAction.IMPORT]: false,
  },
};

const studioLimits = {
  ['SUPERADMIN']: {
    maxConfigs: -1,
    maxTemplates: -1,
    maxExportsPerDay: -1,
    cacheTime: 300,
  },
  ['WEBADMIN']: {
    maxConfigs: 100,
    maxTemplates: 50,
    maxExportsPerDay: 100,
    cacheTime: 300,
  },
  ['ADVANCED']: {
    maxConfigs: 50,
    maxTemplates: 25,
    maxExportsPerDay: 50,
    cacheTime: 600,
  },
  ['PREMIUM']: {
    maxConfigs: 20,
    maxTemplates: 10,
    maxExportsPerDay: 20,
    cacheTime: 900,
  },
  ['USER']: {
    maxConfigs: 0,
    maxTemplates: 0,
    maxExportsPerDay: 0,
    cacheTime: 1800,
  },
};

interface StudioFeatures {
  canAccessStudio: boolean;
  canCreateConfigs: boolean;
  canDeleteConfigs: boolean;
  canResetConfigs: boolean;
  canApplyToAll: boolean;
  canExport: boolean;
  canImport: boolean;
}

interface UseStudioPermissionsReturn {
  // Verificación de permisos
  hasPermission: (action: StudioAction) => boolean;
  
  // Features disponibles
  features: StudioFeatures;
  
  // Límites del usuario
  limits: typeof studioLimits[UserRole];
  
  // Información del rol
  role: UserRole | null;
  
  // Fase actual del sistema
  currentPhase: number;
  
  // Verificar si una característica está habilitada
  isFeatureEnabled: (feature: string) => boolean;
  
  // Obtener mensaje de permiso denegado
  getPermissionDeniedMessage: (action: StudioAction) => string;
  
  // Verificar si el usuario puede acceder a Studio
  canAccessStudio: boolean;
}

// Configuración de fases (sincronizada con backend)
const studioPhaseConfig = {
  currentPhase: 1,
  phases: {
    1: {
      name: 'SUPERADMIN Only',
      enabledRoles: ['SUPERADMIN' as UserRole],
      features: ['full_access'],
    },
    2: {
      name: 'Premium Read Access',
      enabledRoles: ['SUPERADMIN' as UserRole, 'WEBADMIN' as UserRole, 'PREMIUM' as UserRole],
      features: ['read_templates', 'export'],
    },
    3: {
      name: 'Premium Write Access',
      enabledRoles: ['SUPERADMIN' as UserRole, 'WEBADMIN' as UserRole, 'PREMIUM' as UserRole],
      features: ['read_templates', 'write_templates', 'export', 'limited_delete'],
    },
    4: {
      name: 'General Availability',
      enabledRoles: ['USER', 'STARTER', 'PRO', 'ENTERPRISE', 'PREMIUM', 'ADVANCED', 'WEBADMIN', 'ADMIN', 'SUPERADMIN'] as UserRole[],
      features: ['basic_templates', 'premium_features', 'full_system'],
    },
  },
};

export function useStudioPermissions(): UseStudioPermissionsReturn {
  const { user } = useAuth();
  const role = user?.role || null;

  const hasPermission = useMemo(() => {
    return (action: StudioAction): boolean => {
      if (!role) return false;
      return studioPermissions[role]?.[action] ?? false;
    };
  }, [role]);

  const features = useMemo<StudioFeatures>(() => ({
    canAccessStudio: hasPermission(StudioAction.READ),
    canCreateConfigs: hasPermission(StudioAction.WRITE),
    canDeleteConfigs: hasPermission(StudioAction.DELETE),
    canResetConfigs: hasPermission(StudioAction.RESET),
    canApplyToAll: hasPermission(StudioAction.APPLY_ALL),
    canExport: hasPermission(StudioAction.EXPORT),
    canImport: hasPermission(StudioAction.IMPORT),
  }), [hasPermission]);

  const limits = useMemo(() => {
    if (!role) return studioLimits['USER'];
    return studioLimits[role] || studioLimits['USER'];
  }, [role]);

  const isFeatureEnabled = useMemo(() => {
    return (feature: string): boolean => {
      const currentPhaseData = studioPhaseConfig.phases[studioPhaseConfig.currentPhase];
      return currentPhaseData.features.includes(feature);
    };
  }, []);

  const canAccessStudio = useMemo(() => {
    if (!role) return false;
    
    // Verificar fase actual
    const currentPhaseData = studioPhaseConfig.phases[studioPhaseConfig.currentPhase];
    const isRoleEnabledInPhase = currentPhaseData.enabledRoles.includes(role);
    
    // Verificar permisos
    const hasReadPermission = hasPermission(StudioAction.READ);
    
    return isRoleEnabledInPhase && hasReadPermission;
  }, [role, hasPermission]);

  const getPermissionDeniedMessage = useMemo(() => {
    return (action: StudioAction): string => {
      const actionMessages: Record<StudioAction, string> = {
        [StudioAction.READ]: 'No tienes permiso para ver las configuraciones de Studio',
        [StudioAction.WRITE]: 'No tienes permiso para crear o modificar configuraciones',
        [StudioAction.DELETE]: 'No tienes permiso para eliminar configuraciones',
        [StudioAction.RESET]: 'No tienes permiso para resetear configuraciones',
        [StudioAction.APPLY_ALL]: 'No tienes permiso para aplicar configuraciones globalmente',
        [StudioAction.EXPORT]: 'No tienes permiso para exportar configuraciones',
        [StudioAction.IMPORT]: 'No tienes permiso para importar configuraciones',
      };
      
      const baseMessage = actionMessages[action] || 'No tienes permiso para realizar esta acción';
      
      // Agregar información sobre el rol requerido
      const requiredRole = getMinimumRoleForAction(action);
      if (requiredRole) {
        return `${baseMessage}. Se requiere rol: ${requiredRole}`;
      }
      
      return baseMessage;
    };
  }, []);

  return {
    hasPermission,
    features,
    limits,
    role,
    currentPhase: studioPhaseConfig.currentPhase,
    isFeatureEnabled,
    getPermissionDeniedMessage,
    canAccessStudio,
  };
}

// Función helper para obtener el rol mínimo requerido
function getMinimumRoleForAction(action: StudioAction): UserRole | null {
  const roleHierarchy: UserRole[] = [
    'USER',
    'PREMIUM',
    'ADVANCED',
    'WEBADMIN',
    'SUPERADMIN',
  ];

  for (const role of roleHierarchy) {
    if (studioPermissions[role]?.[action]) {
      return role;
    }
  }

  return null;
}

// Hook para verificar permisos antes de mostrar componentes
export function useStudioAccess() {
  const { canAccessStudio, role } = useStudioPermissions();
  const { user } = useAuth();

  return {
    hasAccess: canAccessStudio,
    isLoading: !user && !role,
    role,
  };
}