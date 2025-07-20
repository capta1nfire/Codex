/**
 * DataPatternSelector - Data pattern selector with SVG preview
 * 
 * Selector de patrones de datos con vista previa SVG visual
 * 
 * @principle Pilar 1: Seguridad - Validación de valores
 * @principle Pilar 2: Robustez - Manejo de todos los patrones
 * @principle Pilar 3: Simplicidad - UI intuitiva con botones
 * @principle Pilar 4: Modularidad - Componente reutilizable
 * @principle Pilar 5: Valor - Feedback visual inmediato
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3x3, Palette, Sparkles, Plus, X, Square, Maximize2, Droplets } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import { QR_V3_DATA_PATTERNS } from '@/constants/qrV3Options';
import { DATA_PATTERN_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';
import toast from 'react-hot-toast';

interface DataPatternSelectorProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  disabled?: boolean;
}

export function DataPatternSelector({ config, onChange, disabled = false }: DataPatternSelectorProps) {
  const currentPattern = config.data_pattern || 'square';

  const updateColors = (colorUpdates: Partial<QRConfig['colors']>) => {
    onChange({
      colors: { ...config.colors, ...colorUpdates }
    });
  };

  const updateGradient = (gradientUpdates: Partial<QRConfig['gradient']>) => {
    onChange({
      gradient: { ...config.gradient, ...gradientUpdates }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patrón de Datos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Contenedor 1: Selector de patrones */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <Label className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4 text-slate-600" />
              Forma del Patrón
            </Label>
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {QR_V3_DATA_PATTERNS.map((pattern) => {
            const svgPath = DATA_PATTERN_SVG_PATHS[pattern.value as keyof typeof DATA_PATTERN_SVG_PATHS];
            if (!svgPath) return null;
            
            return (
              <Button
                key={pattern.value}
                variant="outline"
                size="sm"
                className={`flex items-center justify-center p-2 h-16 w-16 transition-all duration-200 ${
                  currentPattern === pattern.value 
                    ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
                onClick={() => onChange({ data_pattern: pattern.value })}
                disabled={disabled}
                title={pattern.label}
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
      
      {/* Contenedor 2: Colores del Patrón - Material Design */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-slate-600" />
          Colores del Patrón
        </Label>
        
        {/* Contenido */}
        <div className="space-y-4">
        
        {/* Colores Básicos - Material Design */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Color del Patrón */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Color del Patrón</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.colors?.foreground || '#000000'}
                  onChange={(e) => updateColors({ foreground: e.target.value })}
                  className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  value={config.colors?.foreground || '#000000'}
                  onChange={(e) => updateColors({ foreground: e.target.value })}
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
            
            {/* Color de Fondo */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Color de Fondo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.colors?.background || '#FFFFFF'}
                  onChange={(e) => updateColors({ background: e.target.value })}
                  className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  value={config.colors?.background || '#FFFFFF'}
                  onChange={(e) => updateColors({ background: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1 font-mono text-sm"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Gradiente - Material Design */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              Gradiente
            </Label>
            <Switch
              checked={config.gradient?.enabled || false}
              onCheckedChange={(checked) => updateGradient({ enabled: checked })}
              disabled={disabled}
            />
          </div>

          {config.gradient?.enabled && (
            <div className="space-y-3 pl-6">
              {/* Tipo de gradiente */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Tipo</Label>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { value: 'linear', label: 'Linear', icon: '↗' },
                    { value: 'radial', label: 'Radial', icon: '◎' },
                    { value: 'conic', label: 'Cónico', icon: '◠' },
                    { value: 'diamond', label: 'Diamante', icon: '◆' },
                    { value: 'spiral', label: 'Espiral', icon: '◉' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant="outline"
                      size="sm"
                      className={`h-9 px-2 text-xs transition-all duration-200 ${
                        config.gradient?.gradient_type === type.value
                          ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => updateGradient({ gradient_type: type.value as any })}
                      disabled={disabled}
                      title={type.label}
                    >
                      <span className="text-base">{type.icon}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Colores del gradiente */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Colores</Label>
                <div className="space-y-2">
                  {(config.gradient?.colors || ['#000000', '#666666']).map((color, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(config.gradient?.colors || [])];
                          newColors[index] = e.target.value;
                          updateGradient({ colors: newColors });
                        }}
                        className="h-9 w-12 cursor-pointer"
                        disabled={disabled}
                      />
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...(config.gradient?.colors || [])];
                          newColors[index] = e.target.value;
                          updateGradient({ colors: newColors });
                        }}
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                      {(config.gradient?.colors || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => {
                            const newColors = [...(config.gradient?.colors || [])];
                            newColors.splice(index, 1);
                            updateGradient({ colors: newColors });
                            toast.success('Color eliminado');
                          }}
                          disabled={disabled}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {(config.gradient?.colors || []).length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const newColors = [...(config.gradient?.colors || []), '#999999'];
                      updateGradient({ colors: newColors });
                      toast.success('Color agregado');
                    }}
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Color
                  </Button>
                )}
              </div>

              {/* Control de Ángulo */}
              {config.gradient?.gradient_type === 'linear' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">
                    Ángulo: {config.gradient?.angle || 90}°
                  </Label>
                  <Slider
                    value={[config.gradient?.angle || 90]}
                    onValueChange={([value]) => updateGradient({ angle: value })}
                    max={360}
                    step={15}
                    className="w-full"
                    disabled={disabled}
                  />
                </div>
              )}
              
              {/* Opciones adicionales */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600">Opciones</Label>
                <div className="space-y-2">
                  {/* Aplicar a ojos */}
                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="apply-to-eyes" className="text-sm cursor-pointer">
                      Aplicar a ojos
                    </Label>
                    <Switch
                      id="apply-to-eyes"
                      checked={config.gradient?.apply_to_eyes ?? true}
                      onCheckedChange={(checked) => updateGradient({ apply_to_eyes: checked })}
                      disabled={disabled}
                    />
                  </div>
                  
                  {/* Aplicar a datos */}
                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="apply-to-data" className="text-sm cursor-pointer">
                      Aplicar a datos
                    </Label>
                    <Switch
                      id="apply-to-data"
                      checked={config.gradient?.apply_to_data ?? true}
                      onCheckedChange={(checked) => updateGradient({ apply_to_data: checked })}
                      disabled={disabled}
                    />
                  </div>
                  
                  {/* Por módulo */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <Label htmlFor="per-module" className="text-sm cursor-pointer">
                        Por módulo
                      </Label>
                      <p className="text-xs text-slate-500">Cada módulo con gradiente único</p>
                    </div>
                    <Switch
                      id="per-module"
                      checked={config.gradient?.per_module || false}
                      onCheckedChange={(checked) => updateGradient({ per_module: checked })}
                      disabled={disabled}
                    />
                  </div>
                  
                  {/* Bordes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <Label htmlFor="stroke-style" className="text-sm cursor-pointer">
                          Bordes
                        </Label>
                        <p className="text-xs text-slate-500">Bordes personalizables</p>
                      </div>
                      <Switch
                        id="stroke-style"
                        checked={config.gradient?.stroke_style?.enabled || false}
                        onCheckedChange={(checked) => updateGradient({ 
                          stroke_style: {
                            ...(config.gradient?.stroke_style || {}),
                            enabled: checked,
                            color: config.gradient?.stroke_style?.color || '#FFFFFF',
                            width: config.gradient?.stroke_style?.width || 0.5,
                            opacity: config.gradient?.stroke_style?.opacity || 0.3
                          }
                        })}
                        disabled={disabled}
                      />
                    </div>
                    
                    {/* Controles detallados de bordes */}
                    {config.gradient?.stroke_style?.enabled && (
                      <div className="space-y-3 pl-4">
                        {/* Color del borde */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600">Color del Borde</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={config.gradient?.stroke_style?.color || '#FFFFFF'}
                              onChange={(e) => updateGradient({ 
                                stroke_style: {
                                  ...(config.gradient?.stroke_style || {}),
                                  color: e.target.value
                                }
                              })}
                              className="h-9 w-12 cursor-pointer border border-slate-200 rounded"
                              disabled={disabled}
                            />
                            <Input
                              type="text"
                              value={config.gradient?.stroke_style?.color || '#FFFFFF'}
                              onChange={(e) => updateGradient({ 
                                stroke_style: {
                                  ...(config.gradient?.stroke_style || {}),
                                  color: e.target.value
                                }
                              })}
                              placeholder="#FFFFFF"
                              className="flex-1 font-mono text-sm"
                              disabled={disabled}
                            />
                          </div>
                        </div>
                        
                        {/* Control de Ancho del Borde */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                            <Maximize2 className="h-3 w-3" />
                            Ancho: {(config.gradient?.stroke_style?.width || 0.5).toFixed(2)}
                          </Label>
                          <Slider
                            value={[config.gradient?.stroke_style?.width || 0.5]}
                            onValueChange={([value]) => updateGradient({ 
                              stroke_style: {
                                ...(config.gradient?.stroke_style || {}),
                                width: value
                              }
                            })}
                            min={0.1} // Backend validation requires minimum 0.1
                            max={0.20} // Límite conservador para uso típico. Se puede ampliar hasta 3.0+ si se necesitan efectos dramáticos  
                            step={0.01}
                            className="w-full"
                            disabled={disabled}
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>0.1 (Sutil)</span>
                            <span>0.20 (Moderado)</span>
                          </div>
                          <p className="text-xs text-slate-400 italic">
                            💡 Rango ampliable hasta 3.0 modificando el código para efectos dramáticos
                          </p>
                        </div>
                        
                        {/* Control de Opacidad */}
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-600 flex items-center gap-2">
                            <Droplets className="h-3 w-3" />
                            Opacidad: {Math.round((config.gradient?.stroke_style?.opacity || 0.3) * 100)}% (mín: 10%)
                          </Label>
                          <Slider
                            value={[config.gradient?.stroke_style?.opacity || 0.3]}
                            onValueChange={([value]) => updateGradient({ 
                              stroke_style: {
                                ...(config.gradient?.stroke_style || {}),
                                opacity: value
                              }
                            })}
                            min={0.1} // Backend validation requires minimum 0.1 (10%)
                            max={1.0}
                            step={0.05}
                            className="w-full"
                            disabled={disabled}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
      </CardContent>
    </Card>
  );
}