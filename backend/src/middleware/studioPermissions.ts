/**
 * Sistema de permisos escalable para QR Studio
 *
 * Este middleware permite control granular de permisos
 * y es fácilmente extensible para futuros roles
 */

import { UserRole } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

// Definición de acciones posibles en Studio
export enum StudioAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  RESET = 'reset',
  APPLY_ALL = 'apply_all',
  EXPORT = 'export',
  IMPORT = 'import',
}

// Tipo para la matriz de permisos
type PermissionMatrix = {
  [key in UserRole]?: {
    [key in StudioAction]?: boolean;
  };
};

// Matriz de permisos configurable
export const studioPermissions: PermissionMatrix = {
  [UserRole.SUPERADMIN]: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: true,
    [StudioAction.DELETE]: true,
    [StudioAction.RESET]: true,
    [StudioAction.APPLY_ALL]: true,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: true,
  },
  [UserRole.WEBADMIN]: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: true,
    [StudioAction.DELETE]: true,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: true,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  [UserRole.ADVANCED]: {
    [StudioAction.READ]: true,
    [StudioAction.WRITE]: false, // Will be true in future
    [StudioAction.DELETE]: false,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  [UserRole.PREMIUM]: {
    [StudioAction.READ]: true, // Phase 2: Enable read
    [StudioAction.WRITE]: false, // Phase 3: Enable write
    [StudioAction.DELETE]: false, // Phase 3: Enable delete
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: true,
    [StudioAction.IMPORT]: false,
  },
  [UserRole.USER]: {
    [StudioAction.READ]: false, // Future: Basic templates only
    [StudioAction.WRITE]: false,
    [StudioAction.DELETE]: false,
    [StudioAction.RESET]: false,
    [StudioAction.APPLY_ALL]: false,
    [StudioAction.EXPORT]: false,
    [StudioAction.IMPORT]: false,
  },
};

// Límites por rol (para futuras expansiones)
export const studioLimits = {
  [UserRole.SUPERADMIN]: {
    maxConfigs: -1, // Unlimited
    maxTemplates: -1,
    maxExportsPerDay: -1,
    cacheTime: 300, // 5 minutes
  },
  [UserRole.WEBADMIN]: {
    maxConfigs: 100,
    maxTemplates: 50,
    maxExportsPerDay: 100,
    cacheTime: 300,
  },
  [UserRole.ADVANCED]: {
    maxConfigs: 50,
    maxTemplates: 25,
    maxExportsPerDay: 50,
    cacheTime: 600, // 10 minutes
  },
  [UserRole.PREMIUM]: {
    maxConfigs: 20,
    maxTemplates: 10,
    maxExportsPerDay: 20,
    cacheTime: 900, // 15 minutes
  },
  [UserRole.USER]: {
    maxConfigs: 0,
    maxTemplates: 0,
    maxExportsPerDay: 0,
    cacheTime: 1800, // 30 minutes
  },
};

// Función helper para verificar permisos
export function hasStudioPermission(role: UserRole, action: StudioAction): boolean {
  return studioPermissions[role]?.[action] ?? false;
}

// Función helper para obtener límites
export function getStudioLimits(role: UserRole) {
  return studioLimits[role] || studioLimits[UserRole.USER];
}

// Middleware para verificar permisos de Studio
export function checkStudioPermission(action: StudioAction) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!hasStudioPermission(userRole, action)) {
      return res.status(403).json({
        error: 'Permiso denegado',
        detail: `No tienes permiso para realizar la acción: ${action}`,
        requiredRole: getMinimumRoleForAction(action),
      });
    }

    // Agregar información de permisos al request
    req.studioPermissions = {
      action,
      role: userRole,
      limits: getStudioLimits(userRole),
      permissions: studioPermissions[userRole] || {},
    };

    next();
  };
}

// Obtener el rol mínimo requerido para una acción
function getMinimumRoleForAction(action: StudioAction): UserRole {
  const roleHierarchy: UserRole[] = [
    UserRole.SUPERADMIN,
    UserRole.WEBADMIN,
    UserRole.ADVANCED,
    UserRole.PREMIUM,
    UserRole.USER,
  ];

  for (const role of roleHierarchy.reverse()) {
    if (hasStudioPermission(role, action)) {
      return role;
    }
  }

  return UserRole.SUPERADMIN;
}

// Middleware para verificar límites
export async function checkStudioLimits(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role as UserRole;
  const userId = req.user?.id;

  if (!userRole || !userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const limits = getStudioLimits(userRole);

  // Para SUPERADMIN, no hay límites
  if (limits.maxConfigs === -1) {
    return next();
  }

  try {
    // Aquí se verificarían los límites contra la base de datos
    // Por ahora, solo agregamos los límites al request
    req.studioLimits = limits;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verificando límites' });
  }
}

// Tipos para TypeScript
declare global {
  namespace Express {
    interface Request {
      studioPermissions?: {
        action: StudioAction;
        role: UserRole;
        limits: (typeof studioLimits)[UserRole];
        permissions: Partial<Record<StudioAction, boolean>>;
      };
      studioLimits?: (typeof studioLimits)[UserRole];
    }
  }
}

// Funciones de utilidad para el frontend
export function getStudioPermissionsForRole(role: UserRole) {
  return {
    role,
    permissions: studioPermissions[role] || {},
    limits: studioLimits[role] || studioLimits[UserRole.USER],
    features: {
      canAccessStudio: hasStudioPermission(role, StudioAction.READ),
      canCreateConfigs: hasStudioPermission(role, StudioAction.WRITE),
      canDeleteConfigs: hasStudioPermission(role, StudioAction.DELETE),
      canResetConfigs: hasStudioPermission(role, StudioAction.RESET),
      canApplyToAll: hasStudioPermission(role, StudioAction.APPLY_ALL),
      canExport: hasStudioPermission(role, StudioAction.EXPORT),
      canImport: hasStudioPermission(role, StudioAction.IMPORT),
    },
  };
}

// Configuración de fase de despliegue
export const studioPhaseConfig = {
  currentPhase: 1,
  phases: {
    1: {
      name: 'SUPERADMIN Only',
      enabledRoles: [UserRole.SUPERADMIN],
      features: ['full_access'],
    },
    2: {
      name: 'Premium Read Access',
      enabledRoles: [UserRole.SUPERADMIN, UserRole.WEBADMIN, UserRole.PREMIUM],
      features: ['read_templates', 'export'],
    },
    3: {
      name: 'Premium Write Access',
      enabledRoles: [UserRole.SUPERADMIN, UserRole.WEBADMIN, UserRole.PREMIUM],
      features: ['read_templates', 'write_templates', 'export', 'limited_delete'],
    },
    4: {
      name: 'General Availability',
      enabledRoles: Object.values(UserRole),
      features: ['basic_templates', 'premium_features', 'full_system'],
    },
  },
};

// Verificar si una característica está disponible en la fase actual
export function isFeatureEnabled(feature: string): boolean {
  const currentPhaseConfig = studioPhaseConfig.phases[studioPhaseConfig.currentPhase];
  return currentPhaseConfig.features.includes(feature);
}
