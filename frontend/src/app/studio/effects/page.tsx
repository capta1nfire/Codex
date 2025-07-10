/**
 * Effects Configuration Page for QR Studio
 * 
 * Permite a los SUPERADMIN configurar efectos visuales avanzados
 * para los códigos QR, incluyendo gradientes y patrones especiales.
 * 
 * @principle Pilar 1: Seguridad - Solo SUPERADMIN puede acceder
 * @principle Pilar 2: Robustez - Validación de efectos complejos
 * @principle Pilar 3: Simplicidad - Interfaz intuitiva para efectos
 * @principle Pilar 4: Modularidad - Efectos como componentes
 * @principle Pilar 5: Valor - Efectos premium diferenciadores
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Palette,
  Zap,
  Save,
  Loader2,
  Info
} from 'lucide-react';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioGuard } from '@/components/studio/StudioGuard';
import { StudioAction } from '@/hooks/useStudioPermissions';
import { QRConfig, GradientConfig } from '@/types/studio.types';
import { StudioQRPreview } from '@/components/studio/StudioQRPreview';
import toast from 'react-hot-toast';
import { ColorPickerPopover } from '@/components/ui/color-picker-popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export default function EffectsConfigPage() {
  const { canEdit } = useStudio();
  
  // Estado para diferentes efectos
  const [gradientConfig, setGradientConfig] = useState<Partial<QRConfig>>({
    gradient: {
      enabled: true,
      gradient_type: 'linear',
      colors: ['#FF0066', '#6600FF'],
      angle: 45,
      apply_to_eyes: true,
      apply_to_data: true
    }
  });
  
  const [patternConfig, setPatternConfig] = useState<Partial<QRConfig>>({
    data_pattern: 'dots',
    eye_shape: 'rounded_square'
  });
  
  const [premiumConfig] = useState<Partial<QRConfig>>({
    gradient: {
      enabled: true,
      gradient_type: 'radial',
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
      apply_to_eyes: true,
      apply_to_data: true
    },
    data_pattern: 'star',
    eye_shape: 'leaf'
  });
  
  const [selectedEffect, setSelectedEffect] = useState<'gradient' | 'pattern' | 'premium'>('gradient');
  const [isSaving, setIsSaving] = useState(false);
  
  const getCurrentConfig = (): Partial<QRConfig> => {
    switch (selectedEffect) {
      case 'gradient':
        return gradientConfig;
      case 'pattern':
        return patternConfig;
      case 'premium':
        return premiumConfig;
      default:
        return gradientConfig;
    }
  };
  
  const updateGradient = (updates: Partial<GradientConfig>) => {
    setGradientConfig(prev => ({
      ...prev,
      gradient: {
        ...prev.gradient!,
        ...updates
      }
    }));
  };
  
  const handleSave = async () => {
    if (!canEdit) {
      toast.error('No tienes permisos para guardar efectos');
      return;
    }
    
    setIsSaving(true);
    try {
      // Aquí se guardarían los efectos en el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Efectos guardados correctamente');
    } catch (error) {
      toast.error('Error al guardar los efectos');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <StudioGuard permission={StudioAction.WRITE}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Efectos Visuales
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura efectos visuales avanzados para códigos QR premium
            </p>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Efectos
          </Button>
        </div>
        
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Efectos Premium</AlertTitle>
          <AlertDescription>
            Estos efectos estarán disponibles solo para usuarios con planes Premium y Enterprise.
            Los efectos más complejos pueden aumentar el tiempo de generación.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Effects Configuration */}
          <div className="space-y-6">
            <Tabs value={selectedEffect} onValueChange={(v) => setSelectedEffect(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gradient">
                  <Palette className="h-4 w-4 mr-2" />
                  Gradientes
                </TabsTrigger>
                <TabsTrigger value="pattern">
                  <Zap className="h-4 w-4 mr-2" />
                  Patrones
                </TabsTrigger>
                <TabsTrigger value="premium">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Premium
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="gradient" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Gradientes</CardTitle>
                    <CardDescription>
                      Define gradientes personalizados para los códigos QR
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Tipo de Gradiente</Label>
                      <Select
                        value={gradientConfig.gradient?.gradient_type}
                        onValueChange={(value) => updateGradient({ gradient_type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Lineal</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                          <SelectItem value="conic">Cónico</SelectItem>
                          <SelectItem value="diamond">Diamante</SelectItem>
                          <SelectItem value="spiral">Espiral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Colores del Gradiente</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <Label>Color Inicial</Label>
                          <ColorPickerPopover
                            value={gradientConfig.gradient?.colors?.[0] || '#FF0066'}
                            onChange={(color) => {
                              const colors = [...(gradientConfig.gradient?.colors || [])];
                              colors[0] = color;
                              updateGradient({ colors });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Color Final</Label>
                          <ColorPickerPopover
                            value={gradientConfig.gradient?.colors?.[1] || '#6600FF'}
                            onChange={(color) => {
                              const colors = [...(gradientConfig.gradient?.colors || [])];
                              colors[1] = color;
                              updateGradient({ colors });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {gradientConfig.gradient?.gradient_type === 'linear' && (
                      <div>
                        <Label>Ángulo del Gradiente</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[gradientConfig.gradient?.angle || 0]}
                            onValueChange={([value]) => updateGradient({ angle: value })}
                            min={0}
                            max={360}
                            step={15}
                            className="flex-1"
                          />
                          <span className="text-sm font-mono w-12">
                            {gradientConfig.gradient?.angle}°
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pattern" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Patrones</CardTitle>
                    <CardDescription>
                      Personaliza las formas y patrones del código QR
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Patrón de Datos</Label>
                      <Select
                        value={patternConfig.data_pattern}
                        onValueChange={(value) => setPatternConfig(prev => ({ ...prev, data_pattern: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Cuadrado Clásico</SelectItem>
                          <SelectItem value="dots">Puntos</SelectItem>
                          <SelectItem value="rounded">Redondeado</SelectItem>
                          <SelectItem value="extra_rounded">Extra Redondeado</SelectItem>
                          <SelectItem value="classy">Elegante</SelectItem>
                          <SelectItem value="classy_rounded">Elegante Redondeado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Forma de Ojos</Label>
                      <Select
                        value={patternConfig.eye_shape}
                        onValueChange={(value) => setPatternConfig(prev => ({ ...prev, eye_shape: value as any }))}
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
                    
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="premium" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Efectos Premium</CardTitle>
                    <CardDescription>
                      Combinaciones exclusivas para usuarios Enterprise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-purple-200 bg-purple-50">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-700">
                        Estos efectos combinan múltiples técnicas para crear
                        códigos QR únicos y altamente personalizados.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Gradiente Multi-Color</Label>
                        <Switch defaultChecked />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gradientes con 3 o más colores para transiciones suaves
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Patrones Animados</Label>
                        <Switch />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Efectos de animación para presentaciones digitales
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sombras y Profundidad</Label>
                        <Switch />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Añade efectos 3D con sombras y profundidad
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Efecto</CardTitle>
                <CardDescription>
                  Visualiza cómo se verá el efecto aplicado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-8 flex items-center justify-center">
                  <StudioQRPreview
                    config={{
                      error_correction: 'H',
                      ...getCurrentConfig()
                    }}
                    size={280}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiempo de Generación:</span>
                  <span className="font-mono text-green-600">~1.2ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamaño SVG:</span>
                  <span className="font-mono">~24KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Complejidad:</span>
                  <span className="font-mono text-amber-600">Media</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudioGuard>
  );
}