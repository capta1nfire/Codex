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

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Grid3x3, Palette } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import { QR_V3_DATA_PATTERNS } from '@/constants/qrV3Options';
import { DATA_PATTERN_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';

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

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-3">
      <Label className="flex items-center gap-2">
        <Grid3x3 className="h-4 w-4 text-slate-600" />
        Patrón de Datos
      </Label>
      
      <div className="grid grid-cols-[60%_1px_40%] gap-4 items-start">
        {/* Columna 1: Selector de patrones */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Forma</Label>
          <div className="grid grid-cols-5 gap-2">
        {QR_V3_DATA_PATTERNS.map((pattern) => {
          const svgPath = DATA_PATTERN_SVG_PATHS[pattern.value as keyof typeof DATA_PATTERN_SVG_PATHS];
          if (!svgPath) return null;
          
          return (
            <Button
              key={pattern.value}
              variant="outline"
              size="sm"
              className={`flex items-center justify-center p-2 min-h-16 min-w-16 transition-all duration-200 ${
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
        
        {/* Separador vertical */}
        <div className="bg-slate-200 h-full min-h-32"></div>
        
        {/* Columna 2: Controles de colores */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4 text-slate-600" />
            Colores
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Color principal */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Principal</Label>
              <div className="space-y-1">
                <Input
                  type="color"
                  value={config.colors?.foreground || '#000000'}
                  onChange={(e) => updateColors({ foreground: e.target.value })}
                  className="h-8 w-full cursor-pointer"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  value={config.colors?.foreground || '#000000'}
                  onChange={(e) => updateColors({ foreground: e.target.value })}
                  placeholder="#000000"
                  className="w-full font-mono text-xs"
                  disabled={disabled}
                />
              </div>
            </div>
            
            {/* Color de fondo */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-600">Fondo</Label>
              <div className="space-y-1">
                <Input
                  type="color"
                  value={config.colors?.background || '#FFFFFF'}
                  onChange={(e) => updateColors({ background: e.target.value })}
                  className="h-8 w-full cursor-pointer"
                  disabled={disabled}
                />
                <Input
                  type="text"
                  value={config.colors?.background || '#FFFFFF'}
                  onChange={(e) => updateColors({ background: e.target.value })}
                  placeholder="#FFFFFF"
                  className="w-full font-mono text-xs"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}