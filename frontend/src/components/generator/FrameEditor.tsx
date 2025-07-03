/**
 * Frame Editor Component
 * 
 * Allows users to customize QR code frames with editable CTA text
 * and various styling options.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Palette, 
  Square, 
  Move,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FrameOptions {
  enabled: boolean;
  frame_type: 'simple' | 'rounded' | 'decorated' | 'bubble' | 'speech' | 'badge';
  text: string;
  text_size: number;
  text_font: string;
  color: string;
  background_color: string;
  text_position: 'top' | 'bottom' | 'left' | 'right';
  padding: number;
  border_width: number;
  corner_radius: number;
}

interface FrameEditorProps {
  options: Partial<FrameOptions>;
  onChange: (options: Partial<FrameOptions>) => void;
  className?: string;
}

const DEFAULT_FRAME_OPTIONS: FrameOptions = {
  enabled: false,
  frame_type: 'simple',
  text: 'Escanéame',
  text_size: 14,
  text_font: 'Arial',
  color: '#000000',
  background_color: '#FFFFFF',
  text_position: 'bottom',
  padding: 10,
  border_width: 2,
  corner_radius: 0,
};

const FRAME_TYPES = [
  { value: 'simple', label: 'Simple', icon: Square },
  { value: 'rounded', label: 'Redondeado', icon: Square },
  { value: 'decorated', label: 'Decorado', icon: Sparkles },
  { value: 'bubble', label: 'Burbuja', icon: Square },
  { value: 'speech', label: 'Diálogo', icon: Square },
  { value: 'badge', label: 'Insignia', icon: Square },
];

const PRESET_TEXTS = [
  'Escanéame',
  '¡Descuento 20%!',
  'Menú Digital',
  'Más información',
  'Síguenos',
  'Reserva ahora',
  'Ver catálogo',
  '¡Oferta especial!',
];

const FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
];

export function FrameEditor({
  options: externalOptions,
  onChange,
  className
}: FrameEditorProps) {
  const [options, setOptions] = useState<FrameOptions>({
    ...DEFAULT_FRAME_OPTIONS,
    ...externalOptions
  });

  // Update local state when external options change
  useEffect(() => {
    setOptions(prev => ({
      ...prev,
      ...externalOptions
    }));
  }, [externalOptions]);

  const handleChange = (updates: Partial<FrameOptions>) => {
    const newOptions = { ...options, ...updates };
    setOptions(newOptions);
    onChange(newOptions);
  };

  const handleToggleFrame = (enabled: boolean) => {
    handleChange({ enabled });
  };

  const handleReset = () => {
    setOptions(DEFAULT_FRAME_OPTIONS);
    onChange(DEFAULT_FRAME_OPTIONS);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Square className="w-5 h-5" />
            Editor de Marco
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={options.enabled}
              onCheckedChange={handleToggleFrame}
            />
            <Label htmlFor="frame-enabled" className="text-sm">
              {options.enabled ? 'Activado' : 'Desactivado'}
            </Label>
          </div>
        </div>
      </CardHeader>

      {options.enabled && (
        <CardContent className="space-y-6">
          {/* Frame Type */}
          <div className="space-y-2">
            <Label>Tipo de Marco</Label>
            <div className="grid grid-cols-3 gap-2">
              {FRAME_TYPES.map(type => (
                <Button
                  key={type.value}
                  variant={options.frame_type === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange({ frame_type: type.value as any })}
                  className="w-full"
                >
                  <type.icon className="w-4 h-4 mr-1" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* CTA Text */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Texto del CTA
            </Label>
            <Input
              value={options.text}
              onChange={(e) => handleChange({ text: e.target.value })}
              maxLength={50}
              placeholder="Ej: ¡20% de descuento!"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {options.text.length}/50 caracteres
              </p>
            </div>
            
            {/* Preset Texts */}
            <div className="flex flex-wrap gap-1 mt-2">
              {PRESET_TEXTS.map(text => (
                <Button
                  key={text}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => handleChange({ text })}
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>

          {/* Text Position */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Move className="w-4 h-4" />
              Posición del Texto
            </Label>
            <Select
              value={options.text_position}
              onValueChange={(value) => handleChange({ text_position: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Arriba</SelectItem>
                <SelectItem value="bottom">Abajo</SelectItem>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Select
                value={options.text_font}
                onValueChange={(value) => handleChange({ text_font: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tamaño: {options.text_size}px</Label>
              <Slider
                value={[options.text_size]}
                onValueChange={([value]) => handleChange({ text_size: value })}
                min={10}
                max={20}
                step={1}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color del Texto
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={options.color}
                  onChange={(e) => handleChange({ color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={options.color}
                  onChange={(e) => handleChange({ color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color de Fondo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={options.background_color}
                  onChange={(e) => handleChange({ background_color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={options.background_color}
                  onChange={(e) => handleChange({ background_color: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Spacing & Borders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Padding Interno: {options.padding}px</Label>
              <Slider
                value={[options.padding]}
                onValueChange={([value]) => handleChange({ padding: value })}
                min={5}
                max={20}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Grosor del Borde: {options.border_width}px</Label>
              <Slider
                value={[options.border_width]}
                onValueChange={([value]) => handleChange({ border_width: value })}
                min={1}
                max={5}
                step={1}
              />
            </div>

            {options.frame_type === 'rounded' && (
              <div className="space-y-2">
                <Label>Radio de Esquinas: {options.corner_radius}px</Label>
                <Slider
                  value={[options.corner_radius]}
                  onValueChange={([value]) => handleChange({ corner_radius: value })}
                  min={0}
                  max={20}
                  step={1}
                />
              </div>
            )}
          </div>

          {/* Reset Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Restablecer
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}