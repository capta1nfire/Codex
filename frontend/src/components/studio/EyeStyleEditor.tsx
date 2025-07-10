/**
 * EyeStyleEditor - Editor de estilos de ojos para QR Studio
 * 
 * Permite configurar estilos de ojos en modo unificado o separado.
 * Incluye preview en tiempo real de los cambios.
 * 
 * @principle Pilar 1: Seguridad - Validación de valores
 * @principle Pilar 2: Robustez - Manejo de ambos modos
 * @principle Pilar 3: Simplicidad - UI intuitiva
 * @principle Pilar 4: Modularidad - Componente reutilizable
 * @principle Pilar 5: Valor - Control total sobre estilos
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import { QR_V3_EYE_SHAPES, QR_V3_EYE_BORDER_STYLES, QR_V3_EYE_CENTER_STYLES } from '@/constants/qrV3Options';

interface EyeStyleEditorProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  disabled?: boolean;
}

export function EyeStyleEditor({ config, onChange, disabled = false }: EyeStyleEditorProps) {
  const useSeparatedStyles = config.use_separated_eye_styles || false;

  const handleModeChange = (checked: boolean) => {
    if (checked) {
      // Cambiar a modo separado
      onChange({
        use_separated_eye_styles: true,
        eye_border_style: config.eye_border_style || 'square',
        eye_center_style: config.eye_center_style || 'square',
      });
    } else {
      // Cambiar a modo unificado - aplicar el mismo estilo a ambos
      const unifiedStyle = config.eye_border_style || 'square';
      onChange({
        use_separated_eye_styles: false,
        eye_border_style: unifiedStyle,
        eye_center_style: unifiedStyle,
      });
    }
  };

  const handleUnifiedStyleChange = (value: string) => {
    // En modo unificado, actualizar ambos estilos con el mismo valor
    onChange({
      eye_border_style: value,
      eye_center_style: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Estilos de Ojos
          <div className="flex items-center gap-2">
            <Label htmlFor="eye-mode" className="text-sm font-normal">
              Modo separado
            </Label>
            <Switch
              id="eye-mode"
              checked={useSeparatedStyles}
              onCheckedChange={handleModeChange}
              disabled={disabled}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!useSeparatedStyles ? (
          // Modo Unificado - Usa los mismos estilos pero aplicados a ambos
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="unified-style">Estilo de Ojo (Unificado)</Label>
              <Select
                value={config.eye_border_style || 'square'}
                onValueChange={handleUnifiedStyleChange}
                disabled={disabled}
              >
                <SelectTrigger id="unified-style">
                  <SelectValue placeholder="Seleccionar estilo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Mostramos los estilos de borde que se pueden aplicar a ambos */}
                  {QR_V3_EYE_BORDER_STYLES.filter(style => 
                    // Filtrar solo los estilos que funcionan bien para ambos (marco y centro)
                    ['square', 'rounded_square', 'circle', 'diamond', 'hexagon', 'cross', 'star'].includes(style.value)
                  ).map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <span>{style.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                En modo unificado, el mismo estilo se aplica tanto al marco como al centro del ojo.
                Para estilos independientes, activa el modo separado.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Modo Separado
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="eye-border">Estilo del Marco</Label>
              <Select
                value={config.eye_border_style || 'square'}
                onValueChange={(value) => onChange({ eye_border_style: value as any })}
                disabled={disabled}
              >
                <SelectTrigger id="eye-border">
                  <SelectValue placeholder="Seleccionar estilo de marco" />
                </SelectTrigger>
                <SelectContent>
                  {QR_V3_EYE_BORDER_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <span>{style.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eye-center">Estilo del Centro</Label>
              <Select
                value={config.eye_center_style || 'square'}
                onValueChange={(value) => onChange({ eye_center_style: value as any })}
                disabled={disabled}
              >
                <SelectTrigger id="eye-center">
                  <SelectValue placeholder="Seleccionar estilo de centro" />
                </SelectTrigger>
                <SelectContent>
                  {QR_V3_EYE_CENTER_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{style.icon}</span>
                        <span>{style.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                El modo separado permite personalizar el marco y el centro de forma independiente,
                creando combinaciones únicas como marco hexagonal con centro circular.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Preview de combinaciones populares */}
        {useSeparatedStyles && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium mb-2">Combinaciones populares:</p>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <button
                onClick={() => onChange({ 
                  eye_border_style: 'rounded_square', 
                  eye_center_style: 'circle' 
                })}
                className="block hover:text-blue-600 transition-colors"
                disabled={disabled}
              >
                • Marco redondeado + Centro circular
              </button>
              <button
                onClick={() => onChange({ 
                  eye_border_style: 'circle', 
                  eye_center_style: 'dot' 
                })}
                className="block hover:text-blue-600 transition-colors"
                disabled={disabled}
              >
                • Marco circular + Centro punto
              </button>
              <button
                onClick={() => onChange({ 
                  eye_border_style: 'hexagon', 
                  eye_center_style: 'star' 
                })}
                className="block hover:text-blue-600 transition-colors"
                disabled={disabled}
              >
                • Marco hexagonal + Centro estrella
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}