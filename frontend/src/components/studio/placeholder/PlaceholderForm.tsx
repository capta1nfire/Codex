/**
 * PlaceholderForm - Form component for placeholder configuration
 * 
 * Formulario completo para configurar todos los aspectos del QR placeholder
 * 
 * @principle Pilar 1: Seguridad - Validación de inputs en tiempo real
 * @principle Pilar 2: Robustez - Estados y errores manejados
 * @principle Pilar 3: Simplicidad - Controles intuitivos agrupados lógicamente
 * @principle Pilar 4: Modularidad - Secciones independientes
 * @principle Pilar 5: Valor - Cambios instantáneos en preview
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { QRConfig } from '@/types/studio.types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Shapes, 
  Sparkles,
  Eye,
  Grid3x3,
  Zap,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { EyeStyleEditor } from '@/components/studio/EyeStyleEditor';
import { DataPatternSelector } from '@/components/studio/DataPatternSelector';
import { validateQRConfig, validateColorContrast } from '@/schemas/studio.schema';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PlaceholderFormProps {
  config: QRConfig;
  onChange: (config: QRConfig) => void;
  onPreviewUpdate: () => void;
}

export function PlaceholderForm({ 
  config, 
  onChange, 
  onPreviewUpdate 
}: PlaceholderFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  
  // Pilar 3: Helpers para actualización simple con validación
  const updateConfig = useCallback((updates: Partial<QRConfig>) => {
    console.log('[PlaceholderForm] updateConfig called with:', updates);
    const newConfig = { ...config, ...updates };
    console.log('[PlaceholderForm] New config will be:', newConfig);
    onChange(newConfig);
    onPreviewUpdate();
    
    // Validar configuración
    const validation = validateQRConfig(newConfig);
    if (!validation.isValid && validation.errors) {
      setErrors(validation.errors);
    } else {
      setErrors({});
    }
  }, [config, onChange, onPreviewUpdate]);

  const updateColors = useCallback((colorUpdates: Partial<QRConfig['colors']>) => {
    const newColors = { ...config.colors, ...colorUpdates };
    
    // Validar contraste si ambos colores están definidos
    if (newColors.foreground && newColors.background) {
      const contrastValidation = validateColorContrast(
        newColors.foreground,
        newColors.background
      );
      
      if (!contrastValidation.isValid) {
        setWarnings(prev => ({
          ...prev,
          contrast: contrastValidation.message || 'Contraste insuficiente'
        }));
      } else {
        setWarnings(prev => {
          const { contrast, ...rest } = prev;
          return rest;
        });
      }
    }
    
    updateConfig({
      colors: newColors
    });
  }, [config.colors, updateConfig]);

  const updateGradient = useCallback((gradientUpdates: Partial<QRConfig['gradient']>) => {
    updateConfig({
      gradient: { ...config.gradient, ...gradientUpdates }
    });
  }, [config.gradient, updateConfig]);
  
  // Marcar campo como tocado
  const markTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field));
  }, []);
  
  // Validar al montar el componente
  useEffect(() => {
    const validation = validateQRConfig(config);
    if (!validation.isValid && validation.errors) {
      setErrors(validation.errors);
    }
  }, []);

  // Mostrar indicador de validación general
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;
  const isValid = !hasErrors;
  
  return (
    <div className="space-y-6">
      {/* Indicador de estado de validación */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Configuración válida
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                Hay errores en la configuración
              </span>
            </>
          )}
        </div>
        {hasWarnings && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {Object.keys(warnings).length} advertencia{Object.keys(warnings).length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basics">Básico</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="effects">Efectos</TabsTrigger>
        </TabsList>

        {/* Configuración Básica */}
        <TabsContent value="basics" className="space-y-4 mt-4">
          {/* Patrón de datos - Ahora primero */}
          <DataPatternSelector
            config={config}
            onChange={(updates) => {
              updateConfig(updates);
              markTouched('data_pattern');
            }}
          />

          {/* Editor de estilos de ojos - Modo unificado o separado */}
          <EyeStyleEditor
            config={config}
            onChange={(updates) => {
              updateConfig(updates);
              markTouched('eye_styles');
            }}
          />

          {/* Nivel de corrección */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-slate-600" />
              Corrección de Errores
            </Label>
            <Select
              value={config.error_correction || 'M'}
              onValueChange={(value) => updateConfig({ error_correction: value })}
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
            <p className="text-xs text-slate-500">
              Mayor corrección permite más daño pero reduce capacidad
            </p>
          </div>
        </TabsContent>

        {/* Configuración de Colores */}
        <TabsContent value="colors" className="space-y-4 mt-4">
          {/* Colores básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colores Básicos
            </h3>
            
            {/* Color de primer plano */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color Principal</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.colors?.foreground || '#000000'}
                    onChange={(e) => updateColors({ foreground: e.target.value })}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.colors?.foreground || '#000000'}
                    onChange={(e) => updateColors({ foreground: e.target.value })}
                    placeholder="#000000"
                    className={cn(
                      "flex-1 font-mono text-sm",
                      touched.has('colors.foreground') && errors['colors.foreground'] && "border-red-500"
                    )}
                    onBlur={() => markTouched('colors.foreground')}
                  />
                </div>
              </div>
              
              {/* Color de fondo */}
              <div className="space-y-2">
                <Label>Color de Fondo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.colors?.background || '#FFFFFF'}
                    onChange={(e) => updateColors({ background: e.target.value })}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={config.colors?.background || '#FFFFFF'}
                    onChange={(e) => updateColors({ background: e.target.value })}
                    placeholder="#FFFFFF"
                    className={cn(
                      "flex-1 font-mono text-sm",
                      touched.has('colors.background') && errors['colors.background'] && "border-red-500"
                    )}
                    onBlur={() => markTouched('colors.background')}
                  />
                </div>
              </div>
            </div>

            {/* Colores de ojos */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700">Colores de Ojos (Opcional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Borde Exterior</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.colors?.eye_colors?.outer || config.colors?.foreground || '#000000'}
                      onChange={(e) => updateColors({ 
                        eye_colors: { 
                          ...config.colors?.eye_colors, 
                          outer: e.target.value 
                        }
                      })}
                      className="h-9 w-16 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.colors?.eye_colors?.outer || ''}
                      onChange={(e) => updateColors({ 
                        eye_colors: { 
                          ...config.colors?.eye_colors, 
                          outer: e.target.value 
                        }
                      })}
                      placeholder="Heredar"
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Centro Interior</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.colors?.eye_colors?.inner || config.colors?.foreground || '#000000'}
                      onChange={(e) => updateColors({ 
                        eye_colors: { 
                          ...config.colors?.eye_colors, 
                          inner: e.target.value 
                        }
                      })}
                      className="h-9 w-16 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.colors?.eye_colors?.inner || ''}
                      onChange={(e) => updateColors({ 
                        eye_colors: { 
                          ...config.colors?.eye_colors, 
                          inner: e.target.value 
                        }
                      })}
                      placeholder="Heredar"
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mostrar advertencia de contraste */}
            {warnings.contrast && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700 text-sm">
                  {warnings.contrast}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Mostrar errores de validación de colores */}
            {(errors['colors.foreground'] || errors['colors.background']) && touched.has('colors.foreground') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors['colors.foreground'] || errors['colors.background']}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Fondo transparente */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="transparent-bg" className="text-sm cursor-pointer">
                    Fondo transparente
                  </Label>
                  <p className="text-xs text-slate-500 mt-0.5">Útil para sobreponer el QR en imágenes</p>
                </div>
                <Switch
                  id="transparent-bg"
                  checked={config.transparent_background || false}
                  onCheckedChange={(checked) => updateConfig({ transparent_background: checked })}
                />
              </div>
            </div>
          </div>

        </TabsContent>

        {/* Efectos */}
        <TabsContent value="effects" className="space-y-4 mt-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Efectos Visuales</h3>
            <p className="text-xs text-slate-500">
              Los efectos pueden afectar la legibilidad. Úsalos con moderación.
            </p>
            
            {/* Lista de efectos disponibles */}
            <div className="space-y-2">
              {['shadow', 'glow', 'blur', 'noise', 'vintage'].map((effectType) => {
                const effect = config.effects?.find(e => e.type === effectType);
                const isEnabled = !!effect;
                
                return (
                  <div key={effectType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          const newEffects = [...(config.effects || [])];
                          if (checked) {
                            newEffects.push({ type: effectType, intensity: 50 });
                            toast.success(`Efecto ${effectType} activado`);
                          } else {
                            const index = newEffects.findIndex(e => e.type === effectType);
                            if (index > -1) newEffects.splice(index, 1);
                            toast.success(`Efecto ${effectType} desactivado`);
                          }
                          updateConfig({ effects: newEffects });
                        }}
                      />
                      <Label className="capitalize">{effectType}</Label>
                    </div>
                    {isEnabled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-500">Intensidad:</Label>
                        <Slider
                          value={[effect?.intensity || 50]}
                          onValueChange={([value]) => {
                            const newEffects = [...(config.effects || [])];
                            const index = newEffects.findIndex(e => e.type === effectType);
                            if (index > -1) {
                              newEffects[index] = { ...newEffects[index], intensity: value };
                              updateConfig({ effects: newEffects });
                            }
                          }}
                          max={100}
                          className="w-24"
                        />
                        <span className="text-sm w-8 text-right">{effect?.intensity || 50}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}