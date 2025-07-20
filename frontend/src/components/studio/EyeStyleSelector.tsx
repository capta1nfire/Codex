/**
 * EyeStyleSelector - Eye style selector with SVG preview
 * 
 * Selector de estilos de ojos con vista previa SVG visual
 * Replica la estructura y diseño de DataPatternSelector
 * 
 * @principle Pilar 1: Seguridad - Validación de valores
 * @principle Pilar 2: Robustez - Manejo de todos los estilos
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
import { Eye, Palette, Sparkles, Plus, X, Maximize2, Droplets } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import { QR_V3_EYE_BORDER_STYLES, QR_V3_EYE_CENTER_STYLES } from '@/constants/qrV3Options';
import { EYE_BORDER_SVG_PATHS, EYE_CENTER_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';
import toast from 'react-hot-toast';

interface EyeStyleSelectorProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  disabled?: boolean;
}

export function EyeStyleSelector({ config, onChange, disabled = false }: EyeStyleSelectorProps) {
  console.log('[EyeStyleSelector] Component rendered with config:', config);
  const currentBorderStyle = config.eye_border_style || 'square';
  const currentCenterStyle = config.eye_center_style || 'square';

  const updateEyeColors = (colorUpdates: Partial<QRConfig['eye_colors']>) => {
    onChange({
      eye_colors: { ...config.eye_colors, ...colorUpdates }
    });
  };

  const updateEyeBorderGradient = (gradientUpdates: Partial<QRConfig['eye_border_gradient']>) => {
    onChange({
      eye_border_gradient: { ...config.eye_border_gradient, ...gradientUpdates }
    });
  };

  const updateEyeCenterGradient = (gradientUpdates: Partial<QRConfig['eye_center_gradient']>) => {
    onChange({
      eye_center_gradient: { ...config.eye_center_gradient, ...gradientUpdates }
    });
  };

  return (
    <Card className="bg-red-50 border-red-500 border-2">
      <CardHeader>
        <CardTitle className="text-base">Forma de Ojos (Esquinas)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Contenedor 1: Selector de estilos de ojos */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-600" />
              Estilos de Ojos
            </Label>
            
            {/* Selector de borde exterior */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Borde Exterior</Label>
              <div className="grid grid-cols-5 gap-2 justify-items-center">
                {QR_V3_EYE_BORDER_STYLES.map((style) => {
                  const svgPath = EYE_BORDER_SVG_PATHS[style.value as keyof typeof EYE_BORDER_SVG_PATHS];
                  if (!svgPath) return null;
                  
                  return (
                    <Button
                      key={style.value}
                      variant="outline"
                      size="sm"
                      className={`flex items-center justify-center p-2 h-16 w-16 transition-all duration-200 ${
                        currentBorderStyle === style.value 
                          ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        onChange({ 
                          eye_border_style: style.value,
                          use_separated_eye_styles: true 
                        });
                      }}
                      disabled={disabled}
                      title={style.label}
                    >
                      <svg 
                        width="50" 
                        height="50" 
                        viewBox="0 0 7 7" 
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

            {/* Selector de centro */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600">Centro Interior</Label>
              <div className="grid grid-cols-5 gap-2 justify-items-center">
                {QR_V3_EYE_CENTER_STYLES.map((style) => {
                  const svgPath = EYE_CENTER_SVG_PATHS[style.value as keyof typeof EYE_CENTER_SVG_PATHS];
                  if (!svgPath) return null;
                  
                  return (
                    <Button
                      key={style.value}
                      variant="outline"
                      size="sm"
                      className={`flex items-center justify-center p-2 h-16 w-16 transition-all duration-200 ${
                        currentCenterStyle === style.value 
                          ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        onChange({ 
                          eye_center_style: style.value,
                          use_separated_eye_styles: true 
                        });
                      }}
                      disabled={disabled}
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
          </div>
      
          {/* Contenedor 2: Colores de los Ojos - Material Design */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-slate-600" />
              Colores de los Ojos
            </Label>
            
            {/* Contenido */}
            <div className="space-y-4">
            
              {/* Colores Básicos de Ojos */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Color del Borde Exterior */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Borde Exterior</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.eye_colors?.outer || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateEyeColors({ outer: e.target.value })}
                        className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                        disabled={disabled}
                      />
                      <Input
                        type="text"
                        value={config.eye_colors?.outer || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateEyeColors({ outer: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  
                  {/* Color del Centro Interior */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Centro Interior</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.eye_colors?.inner || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateEyeColors({ inner: e.target.value })}
                        className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                        disabled={disabled}
                      />
                      <Input
                        type="text"
                        value={config.eye_colors?.inner || config.colors?.foreground || '#000000'}
                        onChange={(e) => updateEyeColors({ inner: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Gradiente para Borde Exterior */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    Gradiente Borde Exterior
                  </Label>
                  <Switch
                    checked={config.eye_border_gradient?.enabled || false}
                    onCheckedChange={(checked) => updateEyeBorderGradient({ enabled: checked })}
                    disabled={disabled}
                  />
                </div>

                {config.eye_border_gradient?.enabled && (
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
                              config.eye_border_gradient?.gradient_type === type.value
                                ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => updateEyeBorderGradient({ gradient_type: type.value as any })}
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
                        {(config.eye_border_gradient?.colors || ['#000000', '#666666']).map((color, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(config.eye_border_gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                updateEyeBorderGradient({ colors: newColors });
                              }}
                              className="h-9 w-12 cursor-pointer"
                              disabled={disabled}
                            />
                            <Input
                              type="text"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(config.eye_border_gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                updateEyeBorderGradient({ colors: newColors });
                              }}
                              className="flex-1 font-mono text-sm"
                              disabled={disabled}
                            />
                            {(config.eye_border_gradient?.colors || []).length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => {
                                  const newColors = [...(config.eye_border_gradient?.colors || [])];
                                  newColors.splice(index, 1);
                                  updateEyeBorderGradient({ colors: newColors });
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
                      {(config.eye_border_gradient?.colors || []).length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const newColors = [...(config.eye_border_gradient?.colors || []), '#999999'];
                            updateEyeBorderGradient({ colors: newColors });
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
                    {config.eye_border_gradient?.gradient_type === 'linear' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">
                          Ángulo: {config.eye_border_gradient?.angle || 90}°
                        </Label>
                        <Slider
                          value={[config.eye_border_gradient?.angle || 90]}
                          onValueChange={([value]) => updateEyeBorderGradient({ angle: value })}
                          max={360}
                          step={15}
                          className="w-full"
                          disabled={disabled}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección de Gradiente para Centro Interior */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    Gradiente Centro Interior
                  </Label>
                  <Switch
                    checked={config.eye_center_gradient?.enabled || false}
                    onCheckedChange={(checked) => updateEyeCenterGradient({ enabled: checked })}
                    disabled={disabled}
                  />
                </div>

                {config.eye_center_gradient?.enabled && (
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
                              config.eye_center_gradient?.gradient_type === type.value
                                ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                                : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => updateEyeCenterGradient({ gradient_type: type.value as any })}
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
                        {(config.eye_center_gradient?.colors || ['#000000', '#666666']).map((color, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(config.eye_center_gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                updateEyeCenterGradient({ colors: newColors });
                              }}
                              className="h-9 w-12 cursor-pointer"
                              disabled={disabled}
                            />
                            <Input
                              type="text"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(config.eye_center_gradient?.colors || [])];
                                newColors[index] = e.target.value;
                                updateEyeCenterGradient({ colors: newColors });
                              }}
                              className="flex-1 font-mono text-sm"
                              disabled={disabled}
                            />
                            {(config.eye_center_gradient?.colors || []).length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => {
                                  const newColors = [...(config.eye_center_gradient?.colors || [])];
                                  newColors.splice(index, 1);
                                  updateEyeCenterGradient({ colors: newColors });
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
                      {(config.eye_center_gradient?.colors || []).length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const newColors = [...(config.eye_center_gradient?.colors || []), '#999999'];
                            updateEyeCenterGradient({ colors: newColors });
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
                    {config.eye_center_gradient?.gradient_type === 'linear' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-600">
                          Ángulo: {config.eye_center_gradient?.angle || 90}°
                        </Label>
                        <Slider
                          value={[config.eye_center_gradient?.angle || 90]}
                          onValueChange={([value]) => updateEyeCenterGradient({ angle: value })}
                          max={360}
                          step={15}
                          className="w-full"
                          disabled={disabled}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Opción de Heredar Colores del Patrón */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label htmlFor="inherit-colors" className="text-sm cursor-pointer">
                      Heredar colores del patrón
                    </Label>
                    <p className="text-xs text-slate-500">Los ojos usarán los mismos colores que el patrón de datos</p>
                  </div>
                  <Switch
                    id="inherit-colors"
                    checked={config.gradient?.apply_to_eyes ?? true}
                    onCheckedChange={(checked) => {
                      onChange({
                        gradient: { ...config.gradient, apply_to_eyes: checked }
                      });
                    }}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}