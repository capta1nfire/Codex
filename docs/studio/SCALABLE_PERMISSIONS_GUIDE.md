# 🔐 Guía del Sistema de Permisos Escalable

## Resumen

El sistema de permisos de QR Studio está diseñado para ser escalable y flexible, permitiendo un despliegue gradual de características desde SUPERADMIN hasta usuarios básicos.

## Arquitectura del Sistema

### 1. Matriz de Permisos

El sistema utiliza una matriz de permisos que mapea roles a acciones específicas:

```typescript
type PermissionMatrix = {
  [role: UserRole]: {
    [action: StudioAction]: boolean;
  };
};
```

### 2. Acciones Disponibles

```typescript
enum StudioAction {
  READ = 'read',           // Ver configuraciones
  WRITE = 'write',         // Crear/modificar configuraciones
  DELETE = 'delete',       // Eliminar configuraciones
  RESET = 'reset',         // Resetear a valores por defecto
  APPLY_ALL = 'apply_all', // Aplicar configuración globalmente
  EXPORT = 'export',       // Exportar configuraciones
  IMPORT = 'import',       // Importar configuraciones
}
```

### 3. Permisos por Rol

| Acción | SUPERADMIN | WEBADMIN | ADVANCED | PREMIUM | USER |
|--------|------------|----------|----------|---------|------|
| READ | ✅ | ✅ | ✅ | ✅* | ❌ |
| WRITE | ✅ | ✅ | ❌ | ❌* | ❌ |
| DELETE | ✅ | ✅ | ❌ | ❌* | ❌ |
| RESET | ✅ | ❌ | ❌ | ❌ | ❌ |
| APPLY_ALL | ✅ | ✅ | ❌ | ❌ | ❌ |
| EXPORT | ✅ | ✅ | ✅ | ✅ | ❌ |
| IMPORT | ✅ | ❌ | ❌ | ❌ | ❌ |

*Se habilitará en fases posteriores

### 4. Límites por Rol

```javascript
const studioLimits = {
  SUPERADMIN: {
    maxConfigs: -1,        // Ilimitado
    maxTemplates: -1,      // Ilimitado
    maxExportsPerDay: -1,  // Ilimitado
    cacheTime: 300,        // 5 minutos
  },
  WEBADMIN: {
    maxConfigs: 100,
    maxTemplates: 50,
    maxExportsPerDay: 100,
    cacheTime: 300,
  },
  ADVANCED: {
    maxConfigs: 50,
    maxTemplates: 25,
    maxExportsPerDay: 50,
    cacheTime: 600,       // 10 minutos
  },
  PREMIUM: {
    maxConfigs: 20,
    maxTemplates: 10,
    maxExportsPerDay: 20,
    cacheTime: 900,       // 15 minutos
  },
  USER: {
    maxConfigs: 0,
    maxTemplates: 0,
    maxExportsPerDay: 0,
    cacheTime: 1800,      // 30 minutos
  },
};
```

## Implementación

### Backend: Middleware de Permisos

```typescript
import { checkStudioPermission, StudioAction } from '@/middleware/studioPermissions';

// Proteger endpoint con permiso específico
router.post(
  '/configs',
  authMiddleware.authenticate,
  checkStudioPermission(StudioAction.WRITE),
  createConfig
);

// Verificar límites
router.post(
  '/configs',
  authMiddleware.authenticate,
  checkStudioPermission(StudioAction.WRITE),
  checkStudioLimits,
  createConfig
);
```

### Frontend: Hook de Permisos

```typescript
import { useStudioPermissions } from '@/hooks/useStudioPermissions';

function StudioComponent() {
  const { features, hasPermission, getPermissionDeniedMessage } = useStudioPermissions();
  
  // Verificar permisos antes de mostrar UI
  if (!features.canCreateConfigs) {
    return <div>No tienes permiso para crear configuraciones</div>;
  }
  
  // Verificar permiso específico
  const handleDelete = () => {
    if (!hasPermission(StudioAction.DELETE)) {
      toast.error(getPermissionDeniedMessage(StudioAction.DELETE));
      return;
    }
    // Proceder con eliminación
  };
}
```

### Verificación de Acceso

```typescript
import { useStudioAccess } from '@/hooks/useStudioPermissions';

function StudioGuard({ children }) {
  const { hasAccess, isLoading } = useStudioAccess();
  
  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <AccessDenied />;
  
  return children;
}
```

## Fases de Despliegue

### Fase 1: SUPERADMIN Only (Actual)
```javascript
{
  enabledRoles: [SUPERADMIN],
  features: ['full_access'],
}
```

### Fase 2: Premium Read Access
```javascript
{
  enabledRoles: [SUPERADMIN, WEBADMIN, PREMIUM],
  features: ['read_templates', 'export'],
  // Habilitar: PREMIUM.READ = true
}
```

### Fase 3: Premium Write Access
```javascript
{
  enabledRoles: [SUPERADMIN, WEBADMIN, PREMIUM],
  features: ['read_templates', 'write_templates', 'export', 'limited_delete'],
  // Habilitar: PREMIUM.WRITE = true, PREMIUM.DELETE = true (con límites)
}
```

### Fase 4: General Availability
```javascript
{
  enabledRoles: Object.values(UserRole),
  features: ['basic_templates', 'premium_features', 'full_system'],
  // Habilitar: USER.READ = true (solo plantillas básicas)
}
```

## Cómo Modificar Permisos

### 1. Actualizar Backend

```typescript
// backend/src/middleware/studioPermissions.ts
export const studioPermissions: PermissionMatrix = {
  [UserRole.PREMIUM]: {
    [StudioAction.READ]: true,    // Cambiar a true
    [StudioAction.WRITE]: true,   // Cambiar a true para Fase 3
    // ...
  },
};
```

### 2. Actualizar Frontend

```typescript
// frontend/src/hooks/useStudioPermissions.tsx
const studioPermissions: PermissionMatrix = {
  [UserRole.PREMIUM]: {
    [StudioAction.READ]: true,    // Sincronizar con backend
    [StudioAction.WRITE]: true,   // Sincronizar con backend
    // ...
  },
};
```

### 3. Actualizar Fase Actual

```typescript
// En ambos archivos
const studioPhaseConfig = {
  currentPhase: 2, // Cambiar a la fase deseada
  // ...
};
```

## Ejemplos de Uso

### Verificar Múltiples Permisos

```typescript
function RequirePermissions({ actions, children }) {
  const { hasPermission } = useStudioPermissions();
  
  const hasAllPermissions = actions.every(action => hasPermission(action));
  
  if (!hasAllPermissions) {
    return <InsufficientPermissions />;
  }
  
  return children;
}

// Uso
<RequirePermissions actions={[StudioAction.READ, StudioAction.WRITE]}>
  <StudioEditor />
</RequirePermissions>
```

### Mostrar UI Condicional

```typescript
function StudioNavigation() {
  const { features } = useStudioPermissions();
  
  return (
    <nav>
      {features.canAccessStudio && (
        <Link href="/studio">Studio</Link>
      )}
      {features.canImport && (
        <Button onClick={handleImport}>Importar</Button>
      )}
      {features.canExport && (
        <Button onClick={handleExport}>Exportar</Button>
      )}
    </nav>
  );
}
```

### Límites de Usuario

```typescript
function ConfigList() {
  const { limits } = useStudioPermissions();
  const [configs, setConfigs] = useState([]);
  
  const canAddMore = limits.maxConfigs === -1 || configs.length < limits.maxConfigs;
  
  return (
    <div>
      <p>Configuraciones: {configs.length} / {limits.maxConfigs === -1 ? '∞' : limits.maxConfigs}</p>
      <Button disabled={!canAddMore}>
        Agregar Configuración
      </Button>
    </div>
  );
}
```

## API de Permisos

### checkStudioPermission(action)
Middleware que verifica si el usuario tiene permiso para realizar una acción.

### hasStudioPermission(role, action)
Función helper que verifica si un rol tiene un permiso específico.

### getStudioLimits(role)
Obtiene los límites configurados para un rol.

### useStudioPermissions()
Hook que proporciona acceso a permisos y características en el frontend.

### useStudioAccess()
Hook simplificado para verificar acceso básico a Studio.

## Mejores Prácticas

1. **Sincronización Backend/Frontend**: Mantener las matrices de permisos sincronizadas
2. **Verificación Doble**: Verificar permisos tanto en frontend como backend
3. **Mensajes Claros**: Usar `getPermissionDeniedMessage` para mensajes consistentes
4. **Límites Progresivos**: Implementar límites graduales por rol
5. **Caché Inteligente**: Tiempos de caché más largos para roles con menos permisos

## Troubleshooting

### "Permission denied" inesperado
1. Verificar que las matrices estén sincronizadas
2. Confirmar que la fase actual es correcta
3. Verificar el rol del usuario en la base de datos

### Límites no se aplican
1. Verificar que `checkStudioLimits` esté en la cadena de middleware
2. Confirmar que los límites estén configurados para el rol

### Características no disponibles en fase
1. Verificar `currentPhase` en ambos archivos
2. Confirmar que el rol esté en `enabledRoles` de la fase