/**
 * PlaceholderPresets - Preset configurations for placeholder QR
 * 
 * Configuraciones predefinidas profesionales para aplicar rápidamente
 * estilos atractivos al QR placeholder.
 * 
 * @principle Pilar 1: Seguridad - Configuraciones validadas y seguras
 * @principle Pilar 2: Robustez - Presets probados y optimizados
 * @principle Pilar 3: Simplicidad - Un clic para aplicar
 * @principle Pilar 4: Modularidad - Fácil agregar nuevos presets
 * @principle Pilar 5: Valor - Estilos profesionales instantáneos
 */

'use client';

import { QRConfig } from '@/types/studio.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  Palette, 
  Zap,
  Heart,
  Star,
  Flame,
  Waves,
  Mountain,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderPresetsProps {
  onApply: (config: QRConfig) => void;
  currentConfig: QRConfig;
}

// Definición de presets profesionales
const presets: Array<{
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  config: QRConfig;
}> = [
  {
    id: 'classic',
    name: 'Clásico',
    description: 'Simple y elegante, perfecto para cualquier uso',
    icon: Star,
    tags: ['simple', 'profesional'],
    config: {
      eye_shape: 'square',
      data_pattern: 'square',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
      error_correction: 'M',
    },
  },
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Diseño contemporáneo con bordes redondeados',
    icon: Sparkles,
    tags: ['moderno', 'suave'],
    config: {
      eye_shape: 'rounded_square',
      data_pattern: 'rounded',
      colors: {
        foreground: '#1a1a1a',
        background: '#FFFFFF',
      },
      error_correction: 'H',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrante',
    description: 'Gradiente colorido que capta la atención',
    icon: Palette,
    tags: ['colorido', 'gradiente'],
    config: {
      eye_shape: 'circle',
      data_pattern: 'dots',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
      gradient: {
        enabled: true,
        gradient_type: 'linear',
        colors: ['#FF0080', '#7928CA'],
        angle: 135,
        apply_to_eyes: false,
        apply_to_data: true,
      },
      error_correction: 'M',
    },
  },
  {
    id: 'ocean',
    name: 'Océano',
    description: 'Tonos azules relajantes con efecto de olas',
    icon: Waves,
    tags: ['azul', 'gradiente', 'calma'],
    config: {
      eye_shape: 'leaf',
      data_pattern: 'wave',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
        eye_colors: {
          outer: '#0066CC',
          inner: '#004499',
        },
      },
      gradient: {
        enabled: true,
        gradient_type: 'radial',
        colors: ['#0099FF', '#0066CC', '#003366'],
        apply_to_eyes: false,
        apply_to_data: true,
      },
      error_correction: 'H',
    },
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    description: 'Colores cálidos inspirados en la puesta de sol',
    icon: Sun,
    tags: ['cálido', 'gradiente', 'naranja'],
    config: {
      eye_shape: 'circle',
      data_pattern: 'circular',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
      gradient: {
        enabled: true,
        gradient_type: 'radial',
        colors: ['#FFA500', '#FF6347', '#FF4500'],
        apply_to_eyes: true,
        apply_to_data: true,
      },
      effects: [
        { type: 'glow', intensity: 30 },
      ],
      error_correction: 'M',
    },
  },
  {
    id: 'midnight',
    name: 'Medianoche',
    description: 'Estilo oscuro elegante con toques de luz',
    icon: Moon,
    tags: ['oscuro', 'elegante', 'profesional'],
    config: {
      eye_shape: 'diamond',
      data_pattern: 'star',
      colors: {
        foreground: '#FFFFFF',
        background: '#000000',
        eye_colors: {
          outer: '#4A90E2',
          inner: '#FFFFFF',
        },
      },
      effects: [
        { type: 'shadow', intensity: 50 },
      ],
      error_correction: 'H',
    },
  },
  {
    id: 'nature',
    name: 'Naturaleza',
    description: 'Tonos verdes orgánicos con formas suaves',
    icon: Mountain,
    tags: ['verde', 'natural', 'ecológico'],
    config: {
      eye_shape: 'leaf',
      data_pattern: 'rounded',
      colors: {
        foreground: '#2E7D32',
        background: '#F5F5F5',
        eye_colors: {
          outer: '#1B5E20',
          inner: '#4CAF50',
        },
      },
      gradient: {
        enabled: true,
        gradient_type: 'linear',
        colors: ['#4CAF50', '#8BC34A'],
        angle: 45,
        apply_to_eyes: false,
        apply_to_data: true,
      },
      error_correction: 'M',
    },
  },
  {
    id: 'passion',
    name: 'Pasión',
    description: 'Diseño romántico con corazones y tonos rojos',
    icon: Heart,
    tags: ['amor', 'rojo', 'romántico'],
    config: {
      eye_shape: 'heart',
      data_pattern: 'dots',
      colors: {
        foreground: '#E91E63',
        background: '#FFF0F5',
        eye_colors: {
          outer: '#C2185B',
          inner: '#F06292',
        },
      },
      effects: [
        { type: 'glow', intensity: 40 },
      ],
      error_correction: 'H',
    },
  },
  {
    id: 'tech',
    name: 'Tecnológico',
    description: 'Estilo futurista con efectos de neón',
    icon: Zap,
    tags: ['tech', 'neón', 'futurista'],
    config: {
      eye_shape: 'hexagon',
      data_pattern: 'cross',
      colors: {
        foreground: '#00D4FF',
        background: '#0A0A0A',
        eye_colors: {
          outer: '#00D4FF',
          inner: '#FFFFFF',
        },
      },
      gradient: {
        enabled: true,
        gradient_type: 'conic',
        colors: ['#00D4FF', '#FF00FF', '#00D4FF'],
        apply_to_eyes: false,
        apply_to_data: true,
      },
      effects: [
        { type: 'glow', intensity: 60 },
        { type: 'noise', intensity: 20 },
      ],
      error_correction: 'M',
    },
  },
  {
    id: 'fire',
    name: 'Fuego',
    description: 'Gradiente ardiente con efectos dramáticos',
    icon: Flame,
    tags: ['fuego', 'dramático', 'energía'],
    config: {
      eye_shape: 'star',
      data_pattern: 'star',
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
      gradient: {
        enabled: true,
        gradient_type: 'radial',
        colors: ['#FF0000', '#FF6600', '#FFCC00'],
        apply_to_eyes: true,
        apply_to_data: true,
      },
      effects: [
        { type: 'glow', intensity: 70 },
        { type: 'shadow', intensity: 30 },
      ],
      error_correction: 'M',
    },
  },
];

export function PlaceholderPresets({ 
  onApply, 
  currentConfig 
}: PlaceholderPresetsProps) {
  // Comparar si el preset actual coincide con alguno
  const getCurrentPresetId = () => {
    // Implementar lógica de comparación simplificada
    return null;
  };

  const currentPresetId = getCurrentPresetId();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
        {presets.map((preset) => {
          const Icon = preset.icon;
          const isActive = currentPresetId === preset.id;
          
          return (
            <Card
              key={preset.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isActive && "ring-2 ring-blue-500"
              )}
              onClick={() => onApply(preset.config)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{preset.name}</h4>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Actual
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-600 mb-2">
                      {preset.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {preset.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs px-2 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mini preview */}
                  <div className="w-16 h-16 rounded border bg-white p-1 flex-shrink-0">
                    <div className="w-full h-full rounded bg-slate-100 flex items-center justify-center">
                      <div className="text-[8px] text-slate-400">QR</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Información adicional */}
      <div className="pt-4 border-t">
        <p className="text-xs text-slate-500 text-center">
          Haz clic en cualquier preset para aplicarlo inmediatamente
        </p>
      </div>
    </div>
  );
}