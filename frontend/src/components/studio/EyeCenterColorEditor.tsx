/**
 * EyeCenterColorEditor - Editor de colores para centros de ojos
 * 
 * Permite configurar colores sólidos o gradientes para los centros de los ojos.
 * Basado en el componente DataPatternSelector pero adaptado para centros de ojos.
 * 
 * @principle Pilar 1: Seguridad - Validación de valores de color
 * @principle Pilar 2: Robustez - Manejo de todos los tipos de gradiente
 * @principle Pilar 3: Simplicidad - UI consistente con otros editores
 * @principle Pilar 4: Modularidad - Componente reutilizable
 * @principle Pilar 5: Valor - Control total sobre colores de centros
 */

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Palette, Sparkles, Plus, X } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import toast from 'react-hot-toast';

interface EyeCenterColorEditorProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  disabled?: boolean;
}

export function EyeCenterColorEditor({ config, onChange, disabled = false }: EyeCenterColorEditorProps) {
  
  const updateCenterColors = (colorUpdates: Partial<QRConfig['eye_center_colors']>) => {
    onChange({
      eye_center_colors: { ...config.eye_center_colors, ...colorUpdates }
    });
  };

  const updateCenterGradient = (gradientUpdates: Partial<QRConfig['eye_center_gradient']>) => {
    onChange({
      eye_center_gradient: { ...config.eye_center_gradient, ...gradientUpdates }
    });
  };

  // Determinar si estamos heredando del patrón principal
  const isInheriting = (config.eye_center_color_mode || 'inherit') === 'inherit';

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-slate-600" />
        Colores del Centro
      </Label>
      
      <div className="space-y-4">
        
        {/* Selector de modo de color */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-600">Modo de Color</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`h-9 px-3 text-xs transition-all duration-200 ${
                isInheriting
                  ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
              onClick={() => onChange({ eye_center_color_mode: 'inherit' })}
              disabled={disabled}
            >
              Heredar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 px-3 text-xs transition-all duration-200 ${
                !isInheriting && !(config.eye_center_gradient?.enabled)
                  ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
              onClick={() => {
                onChange({ 
                  eye_center_color_mode: 'custom',
                  eye_center_gradient: { ...config.eye_center_gradient, enabled: false },
                  eye_center_colors: config.eye_center_colors || { primary: '#000000', secondary: '#666666' }
                });
              }}
              disabled={disabled}
            >
              Sólido
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 px-3 text-xs transition-all duration-200 ${
                !isInheriting && config.eye_center_gradient?.enabled
                  ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
              onClick={() => {
                onChange({ 
                  eye_center_color_mode: 'custom',
                  eye_center_gradient: { ...config.eye_center_gradient, enabled: true }
                });
              }}
              disabled={disabled}
            >
              Gradiente
            </Button>
          </div>
        </div>

        {/* Mostrar mensaje cuando hereda */}
        {isInheriting && (
          <div className="text-sm text-slate-500 italic">
            Los colores del centro heredan del patrón principal
          </div>
        )}

        {/* Colores personalizados cuando no hereda */}
        {!isInheriting && (
          <>
            {/* Color sólido */}
            {!config.eye_center_gradient?.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Color del Centro */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">Color del Centro</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.eye_center_colors?.primary || '#000000'}
                        onChange={(e) => updateCenterColors({ primary: e.target.value })}
                        className="h-10 w-14 cursor-pointer border border-slate-200 rounded"
                        disabled={disabled}
                      />
                      <Input
                        type="text"
                        value={config.eye_center_colors?.primary || '#000000'}
                        onChange={(e) => updateCenterColors({ primary: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 font-mono text-sm"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gradiente */}
            {config.eye_center_gradient?.enabled && (
              <div className="space-y-3">
                {/* Tipo de gradiente */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600">Tipo de Gradiente</Label>
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
                        onClick={() => updateCenterGradient({ gradient_type: type.value as any })}
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
                  <Label className="text-xs font-medium text-slate-600">Colores del Gradiente</Label>
                  <div className="space-y-2">
                    {(config.eye_center_gradient?.colors || ['#000000', '#666666']).map((color, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...(config.eye_center_gradient?.colors || [])];
                            newColors[index] = e.target.value;
                            updateCenterGradient({ colors: newColors });
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
                            updateCenterGradient({ colors: newColors });
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
                              updateCenterGradient({ colors: newColors });
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
                        updateCenterGradient({ colors: newColors });
                        toast.success('Color agregado');
                      }}
                      disabled={disabled}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Color
                    </Button>
                  )}
                </div>

                {/* Control de Ángulo para gradiente lineal */}
                {config.eye_center_gradient?.gradient_type === 'linear' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">
                      Ángulo: {config.eye_center_gradient?.angle || 90}°
                    </Label>
                    <Slider
                      value={[config.eye_center_gradient?.angle || 90]}
                      onValueChange={([value]) => updateCenterGradient({ angle: value })}
                      max={360}
                      step={15}
                      className="w-full"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}