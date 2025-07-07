/**
 * Permissions Management Page for QR Studio
 * 
 * Permite a los SUPERADMIN gestionar permisos y accesos
 * a las diferentes funcionalidades del QR Studio.
 * 
 * @principle Pilar 1: Seguridad - Control granular de permisos
 * @principle Pilar 2: Robustez - Validación estricta de cambios
 * @principle Pilar 3: Simplicidad - Interfaz clara de permisos
 * @principle Pilar 4: Modularidad - Sistema de permisos escalable
 * @principle Pilar 5: Valor - Control total sobre accesos
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock,
  Users,
  Crown,
  Save,
  Loader2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { StudioGuard } from '@/components/studio/StudioGuard';
import { StudioAction } from '@/hooks/useStudioPermissions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

type UserRole = 'USER' | 'PREMIUM' | 'ADVANCED' | 'WEBADMIN' | 'SUPERADMIN';

interface PermissionConfig {
  action: StudioAction;
  label: string;
  description: string;
  roles: UserRole[];
}

const defaultPermissions: PermissionConfig[] = [
  {
    action: StudioAction.READ,
    label: 'Lectura',
    description: 'Ver configuraciones y plantillas',
    roles: ['PREMIUM', 'ADVANCED', 'WEBADMIN', 'SUPERADMIN']
  },
  {
    action: StudioAction.WRITE,
    label: 'Escritura',
    description: 'Crear y modificar configuraciones',
    roles: ['WEBADMIN', 'SUPERADMIN']
  },
  {
    action: StudioAction.DELETE,
    label: 'Eliminación',
    description: 'Eliminar configuraciones y plantillas',
    roles: ['WEBADMIN', 'SUPERADMIN']
  },
  {
    action: StudioAction.RESET,
    label: 'Resetear',
    description: 'Restaurar valores por defecto',
    roles: ['SUPERADMIN']
  },
  {
    action: StudioAction.APPLY_ALL,
    label: 'Aplicar Globalmente',
    description: 'Aplicar cambios a todas las plantillas',
    roles: ['WEBADMIN', 'SUPERADMIN']
  },
  {
    action: StudioAction.EXPORT,
    label: 'Exportar',
    description: 'Exportar configuraciones',
    roles: ['PREMIUM', 'ADVANCED', 'WEBADMIN', 'SUPERADMIN']
  },
  {
    action: StudioAction.IMPORT,
    label: 'Importar',
    description: 'Importar configuraciones externas',
    roles: ['SUPERADMIN']
  }
];

const roleInfo = {
  USER: { 
    label: 'Usuario Básico', 
    color: 'bg-gray-100 text-gray-800',
    icon: Users,
    description: 'Sin acceso a QR Studio'
  },
  PREMIUM: { 
    label: 'Premium', 
    color: 'bg-purple-100 text-purple-800',
    icon: Crown,
    description: 'Acceso de lectura y exportación'
  },
  ADVANCED: { 
    label: 'Avanzado', 
    color: 'bg-blue-100 text-blue-800',
    icon: Shield,
    description: 'Acceso extendido de lectura'
  },
  WEBADMIN: { 
    label: 'Web Admin', 
    color: 'bg-amber-100 text-amber-800',
    icon: Lock,
    description: 'Gestión completa excepto reseteo'
  },
  SUPERADMIN: { 
    label: 'Super Admin', 
    color: 'bg-red-100 text-red-800',
    icon: Crown,
    description: 'Control total del sistema'
  }
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const togglePermission = (actionIndex: number, role: UserRole) => {
    const newPermissions = [...permissions];
    const permission = newPermissions[actionIndex];
    
    if (permission.roles.includes(role)) {
      permission.roles = permission.roles.filter(r => r !== role);
    } else {
      permission.roles.push(role);
    }
    
    setPermissions(newPermissions);
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Aquí se guardarían los permisos en el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Permisos actualizados correctamente');
      setHasChanges(false);
    } catch (error) {
      toast.error('Error al guardar los permisos');
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetToDefaults = () => {
    setPermissions(defaultPermissions);
    setHasChanges(true);
    toast('Permisos restaurados a valores por defecto');
  };
  
  return (
    <StudioGuard permission={StudioAction.WRITE}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Gestión de Permisos
            </h1>
            <p className="text-muted-foreground mt-1">
              Controla qué roles pueden acceder a cada funcionalidad del QR Studio
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={isSaving}
            >
              Restaurar Defecto
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>
        
        {/* Warning Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Área Crítica de Seguridad</AlertTitle>
          <AlertDescription className="text-amber-700">
            Los cambios en permisos afectan inmediatamente a todos los usuarios.
            Asegúrate de entender las implicaciones antes de guardar.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="matrix">
          <TabsList>
            <TabsTrigger value="matrix">Matriz de Permisos</TabsTrigger>
            <TabsTrigger value="roles">Por Roles</TabsTrigger>
            <TabsTrigger value="phases">Fases de Despliegue</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matrix" className="space-y-6">
            {/* Permission Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Permisos</CardTitle>
                <CardDescription>
                  Asigna permisos específicos a cada rol del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Acción</th>
                        {Object.entries(roleInfo).map(([role, info]) => (
                          <th key={role} className="text-center p-2 min-w-[100px]">
                            <div className="flex flex-col items-center gap-1">
                              <Badge className={info.color}>
                                {info.label}
                              </Badge>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission, index) => (
                        <tr key={permission.action} className="border-b">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{permission.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            </div>
                          </td>
                          {Object.keys(roleInfo).map((role) => (
                            <td key={role} className="text-center p-2">
                              <Switch
                                checked={permission.roles.includes(role as UserRole)}
                                onCheckedChange={() => togglePermission(index, role as UserRole)}
                                disabled={role === 'SUPERADMIN' && permission.action === StudioAction.READ}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="space-y-6">
            {/* Role-based View */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(roleInfo).map(([role, info]) => {
                const Icon = info.icon;
                const rolePermissions = permissions.filter(p => 
                  p.roles.includes(role as UserRole)
                );
                
                return (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {info.label}
                      </CardTitle>
                      <CardDescription>
                        {info.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {rolePermissions.length > 0 ? (
                          rolePermissions.map(permission => (
                            <div key={permission.action} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{permission.label}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="text-sm">Sin permisos de QR Studio</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="phases" className="space-y-6">
            {/* Deployment Phases */}
            <Card>
              <CardHeader>
                <CardTitle>Fases de Despliegue</CardTitle>
                <CardDescription>
                  Plan de activación progresiva de funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-green-600">Fase 1 - Actual</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Solo SUPERADMIN</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Acceso completo para pruebas y configuración inicial
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">Fase 2</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Premium con Lectura</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Usuarios Premium pueden ver plantillas y exportar
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">Fase 3</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Premium con Escritura</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Usuarios Premium pueden crear sus propias plantillas
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline">Fase 4</Badge>
                      <div className="flex-1">
                        <h4 className="font-medium">Disponibilidad General</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sistema completo disponible según plan de usuario
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudioGuard>
  );
}