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
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { QRConfig } from '@/types/studio.types';
import { QR_V3_EYE_SHAPES, QR_V3_EYE_BORDER_STYLES, QR_V3_EYE_CENTER_STYLES } from '@/constants/qrV3Options';
import { EYE_BORDER_SVG_PATHS, EYE_CENTER_SVG_PATHS } from '@/constants/eyeStyleSvgPaths';

interface EyeStyleEditorProps {
  config: QRConfig;
  onChange: (updates: Partial<QRConfig>) => void;
  disabled?: boolean;
}

export function EyeStyleEditor({ config, onChange, disabled = false }: EyeStyleEditorProps) {
  const useSeparatedStyles = config.use_separated_eye_styles ?? true; // Default true como página principal

  const handleModeChange = (checked: boolean) => {
    if (checked) {
      // Cambiar a modo separado - mantener valores existentes si los hay
      onChange({
        use_separated_eye_styles: true,
        eye_border_style: config.eye_border_style || config.eye_shape || 'circle',
        eye_center_style: config.eye_center_style || config.eye_shape || 'circle',
        eye_shape: undefined  // Limpiar eye_shape en modo separado
      });
    } else {
      // Cambiar a modo unificado - aplicar el mismo estilo a ambos
      const unifiedStyle = config.eye_shape || config.eye_border_style || 'square';
      onChange({
        use_separated_eye_styles: false,
        eye_shape: unifiedStyle,
        eye_border_style: unifiedStyle,
        eye_center_style: unifiedStyle,
      });
    }
  };

  const handleUnifiedStyleChange = (value: string) => {
    // En modo unificado, actualizar todos los estilos con el mismo valor
    onChange({
      eye_shape: value,
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
              <Label>Estilo de Ojo (Unificado)</Label>
              <div className="grid grid-cols-4 gap-2">
                {QR_V3_EYE_BORDER_STYLES.filter(style => 
                  // Filtrar solo los estilos que funcionan bien para ambos (marco y centro)
                  ['square', 'rounded_square', 'circle', 'diamond', 'hexagon', 'cross', 'star'].includes(style.value)
                ).map((style) => {
                  const svgPath = EYE_BORDER_SVG_PATHS[style.value as keyof typeof EYE_BORDER_SVG_PATHS];
                  return (
                    <Button
                      key={style.value}
                      variant="outline"
                      size="sm"
                      className={`flex items-center justify-center p-2 min-h-16 min-w-16 transition-all duration-200 ${
                        config.eye_shape === style.value || config.eye_border_style === style.value
                          ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleUnifiedStyleChange(style.value)}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estilo del Marco</Label>
              <div className="grid grid-cols-4 gap-2">
                {QR_V3_EYE_BORDER_STYLES.map((style) => {
                  const svgPath = EYE_BORDER_SVG_PATHS[style.value as keyof typeof EYE_BORDER_SVG_PATHS];
                  if (!svgPath) return null;
                  return (
                    <Button
                      key={style.value}
                      variant="outline"
                      size="sm"
                      className={`flex items-center justify-center p-2 min-h-16 min-w-16 transition-all duration-200 ${
                        config.eye_border_style === style.value
                          ? 'border-blue-500 border-2 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => onChange({ eye_border_style: style.value as any })}
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

            <div className="space-y-2">
              <Label>Estilo del Centro</Label>
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
                      onClick={() => onChange({ eye_center_style: style.value as any })}
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
        )}
      </CardContent>
    </Card>
  );
}