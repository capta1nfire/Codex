/**
 * PlaceholderPreview - Preview component for placeholder QR
 * 
 * Muestra una vista previa en tiempo real del QR placeholder con
 * la configuración actual, simulando cómo se verá en la página principal.
 * 
 * @principle Pilar 1: Seguridad - Renderizado seguro sin dangerouslySetInnerHTML
 * @principle Pilar 2: Robustez - Manejo de estados de carga y error
 * @principle Pilar 3: Simplicidad - Preview claro y directo
 * @principle Pilar 4: Modularidad - Reutiliza EnhancedQRV3
 * @principle Pilar 5: Valor - Feedback visual instantáneo
 */

'use client';

import { useState, useMemo } from 'react';
import { QRConfig } from '@/types/studio.types';
import { EnhancedQRV3 } from '@/components/generator/EnhancedQRV3';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Info,
  Smartphone,
  Monitor,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PlaceholderPreviewProps {
  config: QRConfig;
  showControls?: boolean;
}

// URL placeholder que se usa en la página principal
const PLACEHOLDER_URL = 'https://codex.example';

export function PlaceholderPreview({ 
  config, 
  showControls = true 
}: PlaceholderPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  // Crear un objeto QR data mock para EnhancedQRV3
  const qrData = useMemo(() => {
    // Estructura completa para EnhancedQRV3
    return {
      paths: {
        data: 'M10,10 L10,15 L15,15 L15,10 Z M20,10 L20,15 L25,15 L25,10 Z M10,20 L10,25 L15,25 L15,20 Z', // Mock QR pattern
        eyes: [
          { type: 'top-left', path: 'M4,4 L4,11 L11,11 L11,4 Z M5,5 L10,5 L10,10 L5,10 Z', shape: 'square' },
          { type: 'top-right', path: 'M18,4 L18,11 L25,11 L25,4 Z M19,5 L24,5 L24,10 L19,10 Z', shape: 'square' },
          { type: 'bottom-left', path: 'M4,18 L4,25 L11,25 L11,18 Z M5,19 L10,19 L10,24 L5,24 Z', shape: 'square' }
        ]
      },
      styles: {
        data: {
          fill: config.colors?.foreground || '#000000'
        },
        background: {
          fill: config.colors?.background || '#FFFFFF'
        },
        eyes: {
          fill: config.colors?.foreground || '#000000'
        }
      },
      metadata: {
        generation_time_ms: 1,
        quiet_zone: 4,
        content_hash: 'placeholder',
        total_modules: 29,
        data_modules: 21,
        version: 1,
        error_correction: config.error_correction || 'M'
      }
    };
  }, [config]);

  // Descargar QR como SVG
  const handleDownload = () => {
    // Por ahora, mostrar mensaje de que la descarga no está disponible
    toast.info('La descarga de QR placeholder estará disponible próximamente');
  };

  // Copiar configuración al portapapeles
  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast.success('La configuración se ha copiado al portapapeles');
    } catch (err) {
      toast.error('No se pudo copiar la configuración');
    }
  };


  return (
    <div className="space-y-4">
      {/* Controles */}
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyConfig}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!qrData}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Área de preview */}
      <div className={`
        relative bg-gradient-to-br from-slate-50 to-slate-100 
        ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}
        p-8 rounded-lg
      `}>
        {/* Simulación de la página principal */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Prueba nuestro generador de QR
          </h3>
          <p className="text-sm text-slate-600">
            Escanea este código para ver un ejemplo
          </p>
        </div>

        {/* QR Code */}
        <div className="relative">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <EnhancedQRV3 
              data={qrData} 
              size={viewMode === 'mobile' ? 280 : 320}
              totalModules={25}
              dataModules={21}
              version={1}
              errorCorrection={config.error_correction || 'M'}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <Info className="h-4 w-4" />
            <span>URL: {PLACEHOLDER_URL}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="text-xs">
              Versión: {qrData.metadata.version}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Módulos: {qrData.metadata.total_modules}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Tiempo: {qrData.metadata.generation_time_ms}ms
            </Badge>
          </div>
        </div>
      </div>

      {/* Nota sobre el impacto */}
      {showControls && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            Este QR aparece en la página principal y es lo primero que ven los usuarios.
            Los cambios se aplicarán inmediatamente después de guardar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}