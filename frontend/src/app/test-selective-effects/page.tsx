'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Eye, EyeOff, RotateCcw, Download, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import QRSelectiveRenderer from '@/components/QRSelectiveRenderer';

// Tipos para efectos selectivos
interface EffectOption {
  type: string;
  intensity?: number;
  color?: string;
  strength?: number;
  frequency?: number;
  direction?: string;
  width?: number;
  offset_x?: number;
  offset_y?: number;
  blur_radius?: number;
  spread_radius?: number;
  opacity?: number;
}

interface ComponentEffects {
  effects: EffectOption[];
  blend_mode?: string;
  render_priority?: number;
  apply_to_fill?: boolean;
  apply_to_stroke?: boolean;
}

interface SelectiveEffects {
  eyes?: ComponentEffects;
  data?: ComponentEffects;
  frame?: ComponentEffects;
  global?: ComponentEffects;
}

// Opciones disponibles
const EFFECT_TYPES = [
  'shadow', 'glow', 'blur', 'noise', 'vintage',
  'distort', 'emboss', 'outline', 'drop_shadow', 'inner_shadow'
];

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'soft_light', 'hard_light',
  'color_dodge', 'color_burn', 'darken', 'lighten', 'difference', 'exclusion'
];

const COMPONENTS = ['eyes', 'data', 'frame', 'global'];

// Presets predefinidos
const EFFECT_PRESETS = {
  'Neon Glow': {
    eyes: {
      effects: [{ type: 'glow', intensity: 80, color: '#00ff88' }],
      blend_mode: 'screen',
      render_priority: 8
    },
    data: {
      effects: [{ type: 'glow', intensity: 40, color: '#0088ff' }],
      blend_mode: 'overlay',
      render_priority: 5
    }
  },
  'Vintage Style': {
    global: {
      effects: [
        { type: 'vintage', intensity: 70 },
        { type: 'blur', blur_radius: 0.5 }
      ],
      blend_mode: 'multiply',
      render_priority: 3
    }
  },
  'Dramatic Shadow': {
    eyes: {
      effects: [{ type: 'drop_shadow', offset_x: 3, offset_y: 3, blur_radius: 5, opacity: 0.7 }],
      blend_mode: 'multiply',
      render_priority: 7
    },
    data: {
      effects: [{ type: 'inner_shadow', offset_x: 1, offset_y: 1, blur_radius: 2 }],
      blend_mode: 'overlay',
      render_priority: 4
    }
  },
  'Distorted Art': {
    data: {
      effects: [{ type: 'distort', strength: 50 }],
      blend_mode: 'normal',
      render_priority: 6
    },
    eyes: {
      effects: [{ type: 'emboss', strength: 60 }],
      blend_mode: 'hard_light',
      render_priority: 8
    }
  }
};

export default function TestSelectiveEffectsPage() {
  const [qrData, setQrData] = useState('https://example.com/selective-effects-test');
  const [selectiveEffects, setSelectiveEffects] = useState<SelectiveEffects>({});
  const [generatedQR, setGeneratedQR] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('eyes');

  // Auto-generar QR cuando cambien los efectos
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateQR();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [selectiveEffects, qrData]); // generateQR se redefine en cada render, por eso no lo incluimos

  const generateQR = async () => {
    if (!qrData.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:3004/api/v3/qr/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: qrData,
          options: {
            error_correction: 'M',
            customization: {
              selective_effects: Object.keys(selectiveEffects).length > 0 ? selectiveEffects : undefined
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setGeneratedQR(result.data);
        toast.success('QR generado con efectos selectivos');
      } else {
        throw new Error(result.error?.message || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error generando QR:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addEffect = (component: string) => {
    setSelectiveEffects(prev => ({
      ...prev,
      [component]: {
        effects: [...((prev as any)[component]?.effects || []), { type: 'glow' }],
        blend_mode: (prev as any)[component]?.blend_mode || 'normal',
        render_priority: (prev as any)[component]?.render_priority || 5,
        apply_to_fill: (prev as any)[component]?.apply_to_fill ?? true,
        apply_to_stroke: (prev as any)[component]?.apply_to_stroke ?? false
      }
    }));
  };

  const removeEffect = (component: string, effectIndex: number) => {
    setSelectiveEffects(prev => {
      const newEffects = { ...prev };
      if ((newEffects as any)[component]) {
        (newEffects as any)[component].effects = (newEffects as any)[component].effects.filter((_: any, i: number) => i !== effectIndex);
        if ((newEffects as any)[component].effects.length === 0) {
          delete (newEffects as any)[component];
        }
      }
      return newEffects;
    });
  };

  const updateEffect = (component: string, effectIndex: number, updates: Partial<EffectOption>) => {
    setSelectiveEffects(prev => ({
      ...prev,
      [component]: {
        ...(prev as any)[component],
        effects: (prev as any)[component]?.effects.map((effect: EffectOption, i: number) => 
          i === effectIndex ? { ...effect, ...updates } : effect
        ) || []
      }
    }));
  };

  const updateComponentSettings = (component: string, updates: Partial<ComponentEffects>) => {
    setSelectiveEffects(prev => ({
      ...prev,
      [component]: {
        ...(prev as any)[component],
        ...updates
      }
    }));
  };

  const applyPreset = (presetName: string) => {
    setSelectiveEffects((EFFECT_PRESETS as any)[presetName]);
    toast.success(`Preset "${presetName}" aplicado`);
  };

  const clearAllEffects = () => {
    setSelectiveEffects({});
    toast.info('Todos los efectos eliminados');
  };

  const copyConfiguration = () => {
    navigator.clipboard.writeText(JSON.stringify(selectiveEffects, null, 2));
    toast.success('Configuración copiada al portapapeles');
  };

  const renderEffectControls = (component: string, effect: EffectOption, effectIndex: number) => (
    <Card key={effectIndex} className="p-4 space-y-3 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <Select
          value={effect.type}
          onValueChange={(value) => updateEffect(component, effectIndex, { type: value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFECT_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace('_', ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeEffect(component, effectIndex)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Intensidad */}
        {(effect.type === 'glow' || effect.type === 'blur' || effect.type === 'noise') && (
          <div>
            <Label>Intensidad: {effect.intensity || 50}</Label>
            <Slider
              value={[effect.intensity || 50]}
              onValueChange={([value]) => updateEffect(component, effectIndex, { intensity: value })}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
        )}

        {/* Color */}
        {(effect.type === 'glow' || effect.type === 'shadow') && (
          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={effect.color || '#ffffff'}
              onChange={(e) => updateEffect(component, effectIndex, { color: e.target.value })}
              className="mt-1 h-10"
            />
          </div>
        )}

        {/* Fuerza */}
        {(effect.type === 'distort' || effect.type === 'emboss') && (
          <div>
            <Label>Fuerza: {effect.strength || 50}</Label>
            <Slider
              value={[effect.strength || 50]}
              onValueChange={([value]) => updateEffect(component, effectIndex, { strength: value })}
              max={100}
              step={1}
              className="mt-1"
            />
          </div>
        )}

        {/* Offset X/Y para sombras */}
        {(effect.type === 'drop_shadow' || effect.type === 'inner_shadow') && (
          <>
            <div>
              <Label>Offset X: {effect.offset_x || 2}</Label>
              <Slider
                value={[effect.offset_x || 2]}
                onValueChange={([value]) => updateEffect(component, effectIndex, { offset_x: value })}
                min={-10}
                max={10}
                step={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Offset Y: {effect.offset_y || 2}</Label>
              <Slider
                value={[effect.offset_y || 2]}
                onValueChange={([value]) => updateEffect(component, effectIndex, { offset_y: value })}
                min={-10}
                max={10}
                step={1}
                className="mt-1"
              />
            </div>
          </>
        )}

        {/* Radio de desenfoque */}
        {(effect.type === 'drop_shadow' || effect.type === 'inner_shadow' || effect.type === 'blur') && (
          <div>
            <Label>Radio Blur: {effect.blur_radius || 3}</Label>
            <Slider
              value={[effect.blur_radius || 3]}
              onValueChange={([value]) => updateEffect(component, effectIndex, { blur_radius: value })}
              max={20}
              step={0.5}
              className="mt-1"
            />
          </div>
        )}

        {/* Opacidad */}
        {(effect.type === 'drop_shadow' || effect.type === 'inner_shadow') && (
          <div>
            <Label>Opacidad: {effect.opacity || 0.3}</Label>
            <Slider
              value={[effect.opacity || 0.3]}
              onValueChange={([value]) => updateEffect(component, effectIndex, { opacity: value })}
              max={1}
              step={0.1}
              className="mt-1"
            />
          </div>
        )}
      </div>
    </Card>
  );

  const renderComponentPanel = (component: string) => {
    const componentEffects = (selectiveEffects as any)[component];
    const effectCount = componentEffects?.effects?.length || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
            {component}
            <Badge variant="secondary">{effectCount} efectos</Badge>
          </h3>
          <Button
            onClick={() => addEffect(component)}
            disabled={effectCount >= 3}
            size="sm"
          >
            + Agregar Efecto
          </Button>
        </div>

        {componentEffects && (
          <div className="space-y-4">
            {/* Configuración del componente */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="font-medium mb-3">Configuración del Componente</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Blend Mode</Label>
                  <Select
                    value={componentEffects.blend_mode || 'normal'}
                    onValueChange={(value) => updateComponentSettings(component, { blend_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLEND_MODES.map(mode => (
                        <SelectItem key={mode} value={mode}>
                          {mode.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Prioridad: {componentEffects.render_priority || 5}</Label>
                  <Slider
                    value={[componentEffects.render_priority || 5]}
                    onValueChange={([value]) => updateComponentSettings(component, { render_priority: value })}
                    max={10}
                    step={1}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={componentEffects.apply_to_fill ?? true}
                    onCheckedChange={(checked) => updateComponentSettings(component, { apply_to_fill: checked })}
                  />
                  <Label>Aplicar a Relleno</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={componentEffects.apply_to_stroke ?? false}
                    onCheckedChange={(checked) => updateComponentSettings(component, { apply_to_stroke: checked })}
                  />
                  <Label>Aplicar a Borde</Label>
                </div>
              </div>
            </Card>

            {/* Lista de efectos */}
            <div className="space-y-3">
              {componentEffects.effects?.map((effect: any, index: number) => 
                renderEffectControls(component, effect, index)
              )}
            </div>
          </div>
        )}

        {effectCount === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay efectos aplicados a este componente</p>
            <Button onClick={() => addEffect(component)} className="mt-2">
              Agregar primer efecto
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prueba de Efectos Selectivos</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Experimenta con el nuevo sistema de efectos selectivos. Aplica diferentes efectos a componentes específicos del QR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de Configuración */}
        <div className="space-y-6">
          {/* Datos del QR */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del QR</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                placeholder="Ingresa los datos para el QR..."
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Presets Predefinidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(EFFECT_PRESETS).map(presetName => (
                  <Button
                    key={presetName}
                    variant="outline"
                    onClick={() => applyPreset(presetName)}
                    className="text-sm"
                  >
                    {presetName}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={clearAllEffects} variant="destructive" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Limpiar Todo
                </Button>
                <Button onClick={copyConfiguration} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Config
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuración por Componentes */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Efectos</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedComponent} onValueChange={setSelectedComponent}>
                <TabsList className="grid w-full grid-cols-4">
                  {COMPONENTS.map(component => (
                    <TabsTrigger key={component} value={component} className="capitalize">
                      {component}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {COMPONENTS.map(component => (
                  <TabsContent key={component} value={component} className="mt-4">
                    {renderComponentPanel(component)}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Vista Previa */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vista Previa</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview && (
                <div className="space-y-4">
                  {/* QR Generado */}
                  <div className="flex justify-center p-8 bg-white dark:bg-gray-900 rounded-lg">
                    {isGenerating ? (
                      <div className="animate-pulse">
                        <div className="w-64 h-64 bg-gray-300 rounded"></div>
                      </div>
                    ) : generatedQR ? (
                      <div className="relative">
                        <QRSelectiveRenderer 
                          qrData={generatedQR} 
                          className="w-64 h-64"
                        />
                        {/* Badge de efectos aplicados */}
                        {Object.keys(selectiveEffects).length > 0 && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-green-500 text-white">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Efectos Activos
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-64 h-64 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                        <p className="text-gray-500">Ingresa datos para generar QR</p>
                      </div>
                    )}
                  </div>

                  {/* Información Técnica */}
                  {generatedQR && (
                    <div className="space-y-2 text-sm">
                      <h4 className="font-medium">Información Técnica:</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span>Módulos: {generatedQR.metadata?.total_modules}</span>
                        <span>Versión: {generatedQR.metadata?.version}</span>
                        <span>Efectos: {generatedQR.definitions?.filter((d: any) => d.type === 'effect').length || 0}</span>
                        <span>Componentes: {Object.keys(selectiveEffects).length}</span>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div className="flex gap-2">
                    <Button onClick={generateQR} disabled={isGenerating} className="flex-1">
                      {isGenerating ? 'Generando...' : 'Regenerar QR'}
                    </Button>
                    {generatedQR && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Info */}
          {generatedQR && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuración JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectiveEffects, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}