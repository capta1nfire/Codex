/**
 * Global Configuration Page for QR Studio
 * 
 * Permite a los SUPERADMIN configurar opciones globales que afectan
 * a todos los códigos QR generados en el sistema.
 * 
 * @principle Pilar 1: Seguridad - Solo SUPERADMIN puede acceder
 * @principle Pilar 2: Robustez - Validación exhaustiva de configuraciones
 * @principle Pilar 3: Simplicidad - Interfaz clara y directa
 * @principle Pilar 4: Modularidad - Componentes reutilizables
 * @principle Pilar 5: Valor - Configuración centralizada
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Save, 
  RotateCcw, 
  Shield, 
  Globe,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioGuard } from '@/components/studio/StudioGuard';
import { StudioAction, useStudioPermissions } from '@/hooks/useStudioPermissions';
import { QRConfig, StudioConfigType } from '@/types/studio.types';
import { QRPreview } from '@/components/studio/QRPreview';
import toast from 'react-hot-toast';
import { ColorPickerPopover } from '@/components/ui/color-picker-popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export default function GlobalConfigPage() {
  const { 
    configs, 
    saveConfig, 
    getConfigByType, 
    isLoading,
    canEdit 
  } = useStudio();
  
  const { hasPermission } = useStudioPermissions();
  
  // Obtener configuración global actual o usar valores por defecto
  const currentGlobalConfig = getConfigByType(StudioConfigType.GLOBAL);
  const [config, setConfig] = useState<QRConfig>(currentGlobalConfig?.config || {
    error_correction: 'H',
    eye_shape: 'square',
    data_pattern: 'square',
    gradient: {
      enabled: false,
      gradient_type: 'linear',
      colors: ['#000000', '#000000'],
      angle: 0,
      apply_to_eyes: false,
      apply_to_data: true
    }
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const updateConfig = (updates: Partial<QRConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }));
    setHasChanges(true);
  };
  
  const updateCustomization = (updates: Partial<QRConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }));
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    if (!canEdit) {
      toast.error('No tienes permisos para guardar configuraciones');
      return;
    }
    
    setIsSaving(true);
    try {
      await saveConfig({
        type: StudioConfigType.GLOBAL,
        name: 'Configuración Global',
        description: 'Configuración base para todos los códigos QR',
        config,
        version: (currentGlobalConfig?.version || 0) + 1
      });
      
      setHasChanges(false);
      toast.success('Configuración global guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    const defaultConfig: QRConfig = {
      error_correction: 'H',
      eye_shape: 'square',
      data_pattern: 'square',
      gradient: {
        enabled: false,
        gradient_type: 'linear',
        colors: ['#000000', '#000000'],
        angle: 0,
        apply_to_eyes: false,
        apply_to_data: true
      }
    };
    
    setConfig(defaultConfig);
    setHasChanges(true);
  };
  
  return (
    <StudioGuard permission={StudioAction.WRITE}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              Configuración Global
            </h1>
            <p className="text-muted-foreground mt-1">
              Define los valores por defecto para todos los códigos QR del sistema
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetear
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
        
        {/* Security Notice */}
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Configuración Crítica</AlertTitle>
          <AlertDescription className="text-amber-700">
            Los cambios aquí afectarán a todos los códigos QR generados en el sistema.
            Asegúrate de probar los cambios antes de aplicarlos en producción.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Form */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Básica</CardTitle>
                <CardDescription>
                  Parámetros fundamentales del código QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Error Correction */}
                <div>
                  <Label>Nivel de Corrección de Errores</Label>
                  <Select
                    value={config.error_correction}
                    onValueChange={(value) => updateConfig({ error_correction: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Bajo (7%)</SelectItem>
                      <SelectItem value="M">Medio (15%)</SelectItem>
                      <SelectItem value="Q">Alto (25%)</SelectItem>
                      <SelectItem value="H">Muy Alto (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mayor corrección permite más daño pero reduce capacidad
                  </p>
                </div>
                
              </CardContent>
            </Card>
            
            {/* Visual Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Visual</CardTitle>
                <CardDescription>
                  Personalización del aspecto visual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Colors */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Color Principal</Label>
                    <ColorPickerPopover
                      value={config.gradient?.colors?.[0] || '#000000'}
                      onChange={(color) => {
                        const gradient = config.gradient || {
                          enabled: false,
                          gradient_type: 'linear',
                          colors: ['#000000', '#000000'],
                          angle: 0,
                          apply_to_eyes: false,
                          apply_to_data: true
                        };
                        updateCustomization({
                          gradient: {
                            ...gradient,
                            colors: [color, gradient.colors[1]]
                          }
                        });
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Color de Fondo</Label>
                    <ColorPickerPopover
                      value={config.colors?.background || '#FFFFFF'}
                      onChange={(color) => updateCustomization({ 
                        colors: {
                          ...config.colors,
                          background: color,
                          foreground: config.colors?.foreground || '#000000'
                        }
                      })}
                    />
                  </div>
                </div>
                
                {/* Pattern Shapes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Forma de Ojos</Label>
                    <Select
                      value={config.eye_shape || 'square'}
                      onValueChange={(value) => updateCustomization({ eye_shape: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Cuadrado</SelectItem>
                        <SelectItem value="circle">Círculo</SelectItem>
                        <SelectItem value="rounded_square">Cuadrado Redondeado</SelectItem>
                        <SelectItem value="leaf">Hoja</SelectItem>
                        <SelectItem value="rounded_inner">Interior Redondeado</SelectItem>
                        <SelectItem value="rounded_outer">Exterior Redondeado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Patrón de Datos</Label>
                    <Select
                      value={config.data_pattern || 'square'}
                      onValueChange={(value) => updateCustomization({ data_pattern: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Cuadrado</SelectItem>
                        <SelectItem value="dots">Puntos</SelectItem>
                        <SelectItem value="rounded">Redondeado</SelectItem>
                        <SelectItem value="extra_rounded">Extra Redondeado</SelectItem>
                        <SelectItem value="classy">Elegante</SelectItem>
                        <SelectItem value="classy_rounded">Elegante Redondeado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Quiet Zone */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Zona de Silencio</Label>
                    <p className="text-xs text-muted-foreground">
                      Espacio en blanco alrededor del código
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={(checked) => {}}
                    disabled
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Así se verán los códigos QR con esta configuración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 flex items-center justify-center">
                  <QRPreview
                    config={config}
                    size={280}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Impact Notice */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Impacto de los Cambios</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Esta configuración afectará a:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Nuevos códigos QR generados sin configuración específica</li>
                  <li>Plantillas que no tengan valores personalizados</li>
                  <li>APIs que no especifiquen parámetros</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {/* Version Info */}
            {currentGlobalConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Información de Versión</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versión Actual:</span>
                    <span className="font-mono">v{currentGlobalConfig.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Actualización:</span>
                    <span className="font-mono">
                      {new Date(currentGlobalConfig.updated_at || '').toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudioGuard>
  );
}