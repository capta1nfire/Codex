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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { EyeStyleSelector } from '@/components/studio/EyeStyleSelector';
import { DataPatternSelector } from '@/components/studio/DataPatternSelector';
import { QR_V3_EYE_CENTER_STYLES } from '@/constants/qrV3Options';
import { EYE_CENTER_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';
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
    const newGradient = { ...config.gradient, ...gradientUpdates };
    console.log('[PlaceholderForm] updateGradient called:', {
      currentGradient: config.gradient,
      updates: gradientUpdates,
      newGradient: newGradient
    });
    updateConfig({
      gradient: newGradient
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Básico</TabsTrigger>
          <TabsTrigger value="colors">Colores</TabsTrigger>
          <TabsTrigger value="effects">Efectos</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
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

          {/* Selector de estilos de ojos - Con el mismo diseño que DataPatternSelector */}
          {console.log('[PlaceholderForm] Rendering EyeStyleSelector with config:', config)}
          <div key="eye-style-selector-wrapper">
            <EyeStyleSelector
              config={config}
              onChange={(updates) => {
                updateConfig(updates);
                markTouched('eye_styles');
              }}
            />
          </div>

          {/* Estilo del Centro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estilo del Centro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Columna 1: Selector de estilos */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                  <Label className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4 text-slate-600" />
                    Forma del Centro
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {QR_V3_EYE_CENTER_STYLES.map((style) => {
                      const svgPath = EYE_CENTER_SVG_PATHS[style.value as keyof typeof EYE_CENTER_SVG_PATHS];
                      if (!svgPath) return null;
                      return (
                        <Button
                          key={style.value}
                          variant="outline"
                          size="sm"
                          className={`flex items-center justify-center p-2 min-h-16 min-w-16 transition-all duration-200 ${
                            config.eye_center_style === style.value
                              ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            updateConfig({ 
                              eye_center_style: style.value,
                              use_separated_eye_styles: true 
                            });
                            markTouched('eye_center_style');
                          }}
                          disabled={false}
                          title={style.label}
                        >
                          <svg 
                            width="50" 
                            height="50" 
                            viewBox="0 0 3 3" 
                            className="fill-current" 
                            style={{ width: '50px', height: '50px', minWidth: '50px', minHeight: '50px' }}
                          >
                            <path d={svgPath} fillRule="evenodd"/>
                          </svg>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Columna 2: Color del centro */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-slate-600" />
                    Color del Centro
                  </Label>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Centro Interior</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.eye_colors?.inner || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateColors({ 
                          eye_colors: { 
                            ...config.eye_colors, 
                            inner: e.target.value 
                          }
                        })}
                        className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                      />
                      <Input
                        type="text"
                        value={config.eye_colors?.inner || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateColors({ 
                          eye_colors: { 
                            ...config.eye_colors, 
                            inner: e.target.value 
                          }
                        })}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Sección de Gradiente */}
          <div className="space-y-4 mt-6">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Configuración de Gradiente
            </h3>
            
            {/* Activar gradiente */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="gradient-enabled" className="text-sm cursor-pointer">
                  Activar gradiente
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">Usar gradiente en lugar de color sólido</p>
              </div>
              <Switch
                id="gradient-enabled"
                checked={config.gradient?.enabled || false}
                onCheckedChange={(checked) => {
                  updateGradient({ enabled: checked });
                  markTouched('gradient.enabled');
                }}
              />
            </div>

            {/* Opciones de gradiente */}
            {config.gradient?.enabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                {/* Tipo de gradiente */}
                <div className="space-y-2">
                  <Label>Tipo de gradiente</Label>
                  <Select
                    value={config.gradient?.gradient_type || 'linear'}
                    onValueChange={(value) => {
                      updateGradient({ gradient_type: value });
                      markTouched('gradient.gradient_type');
                    }}
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

                {/* Ángulo del gradiente - Solo para gradientes lineales */}
                {config.gradient?.gradient_type === 'linear' && (
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Ángulo del gradiente</span>
                      <span className="text-sm font-semibold text-blue-600 transition-all duration-200">
                        {config.gradient?.angle || 90}°
                      </span>
                    </Label>
                    <div className="relative">
                      <Slider
                        value={[config.gradient?.angle || 90]}
                        onValueChange={([value]) => {
                          console.log('[PlaceholderForm] Gradient angle changed to:', value);
                          updateGradient({ angle: value });
                          markTouched('gradient.angle');
                        }}
                        min={0}
                        max={360}
                        step={1}
                        className="w-full py-4"
                      />
                      {/* Marcadores visuales para ángulos comunes */}
                      <div className="absolute inset-x-0 -bottom-1 flex justify-between px-1 pointer-events-none">
                        <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
                        <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
                        <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
                        <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
                        <div className="w-0.5 h-1.5 bg-slate-300 rounded-full" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      0° = De izquierda a derecha, 90° = De abajo hacia arriba
                    </p>
                    {/* Botones de ángulos predefinidos */}
                    <div className="flex gap-1 mt-2">
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                        <Button
                          key={angle}
                          type="button"
                          variant={config.gradient?.angle === angle ? "default" : "outline"}
                          size="sm"
                          className="flex-1 px-2 py-1 text-xs transition-all duration-200 hover:scale-105"
                          onClick={() => {
                            updateGradient({ angle });
                            markTouched('gradient.angle');
                          }}
                        >
                          {angle}°
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colores del gradiente */}
                <div className="space-y-3">
                  <Label>Colores del gradiente</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Color inicial */}
                    <div className="space-y-2">
                      <Label className="text-xs">Color inicial</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.gradient?.colors?.[0] || '#000000'}
                          onChange={(e) => {
                            const newColors = [...(config.gradient?.colors || ['#000000', '#666666'])];
                            newColors[0] = e.target.value;
                            updateGradient({ colors: newColors });
                            markTouched('gradient.colors');
                          }}
                          className="h-9 w-16 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={config.gradient?.colors?.[0] || '#000000'}
                          onChange={(e) => {
                            const newColors = [...(config.gradient?.colors || ['#000000', '#666666'])];
                            newColors[0] = e.target.value;
                            updateGradient({ colors: newColors });
                            markTouched('gradient.colors');
                          }}
                          placeholder="#000000"
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Color final */}
                    <div className="space-y-2">
                      <Label className="text-xs">Color final</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.gradient?.colors?.[1] || '#666666'}
                          onChange={(e) => {
                            const newColors = [...(config.gradient?.colors || ['#000000', '#666666'])];
                            newColors[1] = e.target.value;
                            updateGradient({ colors: newColors });
                            markTouched('gradient.colors');
                          }}
                          className="h-9 w-16 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={config.gradient?.colors?.[1] || '#666666'}
                          onChange={(e) => {
                            const newColors = [...(config.gradient?.colors || ['#000000', '#666666'])];
                            newColors[1] = e.target.value;
                            updateGradient({ colors: newColors });
                            markTouched('gradient.colors');
                          }}
                          placeholder="#666666"
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aplicar a ojos */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <Label htmlFor="gradient-eyes" className="text-sm cursor-pointer">
                      Aplicar gradiente a ojos
                    </Label>
                    <p className="text-xs text-slate-500 mt-0.5">Usar gradiente también en los patrones de ojos</p>
                  </div>
                  <Switch
                    id="gradient-eyes"
                    checked={config.gradient?.apply_to_eyes || false}
                    onCheckedChange={(checked) => {
                      updateGradient({ apply_to_eyes: checked });
                      markTouched('gradient.apply_to_eyes');
                    }}
                  />
                </div>
              </div>
            )}
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

        {/* Logo */}
        <TabsContent value="logo" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Logo del Placeholder</Label>
              <Badge variant="secondary" className="text-xs">
                Solo visible en placeholder
              </Badge>
            </div>
            
            {/* Enable Logo Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Label htmlFor="logo-enabled" className="text-sm font-medium cursor-pointer">
                Mostrar Logo
              </Label>
              <Switch
                id="logo-enabled"
                checked={config.logo?.enabled || false}
                onCheckedChange={(checked) => {
                  updateConfig({ 
                    logo: { 
                      ...config.logo,
                      enabled: checked,
                      size_percentage: config.logo?.size_percentage || 20,
                      padding: config.logo?.padding || 5,
                      shape: config.logo?.shape || 'square'
                    } 
                  });
                  markTouched('logo.enabled');
                }}
              />
            </div>

            {config.logo?.enabled && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Imagen del Logo</Label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Shapes className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">Click para subir</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          PNG, JPG, SVG (MAX. 2MB)
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 2 * 1024 * 1024) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const result = reader.result as string;
                              console.log('🖼️ [PlaceholderForm] Logo loaded for placeholder:', {
                                fileName: file.name,
                                fileType: file.type,
                                fileSize: file.size,
                                isSVG: file.type === 'image/svg+xml',
                                dataUriPreview: result.substring(0, 100) + '...',
                                dataUriLength: result.length
                              });
                              
                              updateConfig({ 
                                logo: { 
                                  ...config.logo,
                                  data: result,
                                  enabled: true,
                                  size_percentage: config.logo?.size_percentage || 20,
                                  padding: config.logo?.padding || 5,
                                  shape: config.logo?.shape || 'square'
                                } 
                              });
                              markTouched('logo.data');
                            };
                            reader.readAsDataURL(file);
                          } else if (file) {
                            toast.error('El archivo es demasiado grande. Máximo 2MB.');
                          }
                        }}
                      />
                    </label>
                  </div>
                  {config.logo?.data && (
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm text-green-600 dark:text-green-400">Logo cargado</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig({ 
                            logo: { 
                              ...config.logo,
                              data: undefined
                            } 
                          });
                          markTouched('logo.data');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

                {/* Logo Size */}
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Tamaño del Logo</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {config.logo?.size_percentage || 20}%
                    </span>
                  </Label>
                  <Slider
                    value={[config.logo?.size_percentage || 20]}
                    onValueChange={([value]) => {
                      updateConfig({ 
                        logo: { 
                          ...config.logo,
                          size_percentage: value
                        } 
                      });
                      markTouched('logo.size_percentage');
                    }}
                    min={10}
                    max={30}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Logo Shape */}
                <div className="space-y-2">
                  <Label>Forma del Logo</Label>
                  <Select
                    value={config.logo?.shape || 'square'}
                    onValueChange={(value: 'square' | 'circle' | 'rounded_square') => {
                      updateConfig({ 
                        logo: { 
                          ...config.logo,
                          shape: value
                        } 
                      });
                      markTouched('logo.shape');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Cuadrado</SelectItem>
                      <SelectItem value="circle">Círculo</SelectItem>
                      <SelectItem value="rounded_square">Cuadrado Redondeado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Logo Padding */}
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Relleno del Logo</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {config.logo?.padding || 5}px
                    </span>
                  </Label>
                  <Slider
                    value={[config.logo?.padding || 5]}
                    onValueChange={([value]) => {
                      updateConfig({ 
                        logo: { 
                          ...config.logo,
                          padding: value
                        } 
                      });
                      markTouched('logo.padding');
                    }}
                    min={0}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}