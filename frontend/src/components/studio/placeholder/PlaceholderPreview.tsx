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

import { useState, useMemo, useEffect } from 'react';
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
  Check,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQRGenerationState } from '@/hooks/useQRGenerationState';
import { GenerateFormData } from '@/schemas/generate.schema';

interface PlaceholderPreviewProps {
  config: QRConfig;
  showControls?: boolean;
}

// URL placeholder que se usa en la página principal
const PLACEHOLDER_URL = 'https://tu-sitio-web.com';

export function PlaceholderPreview({ 
  config, 
  showControls = true 
}: PlaceholderPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Use the QR generation hook
  const { 
    enhancedData,
    isLoading,
    error,
    generateQR
  } = useQRGenerationState();

  // Convert StudioConfig to GenerateFormData - memoize properly
  const formData = useMemo((): GenerateFormData => {
    // Only include necessary QR v3 fields
    const options: any = {
      error_correction: config.error_correction || 'M',
      customization: {
        gradient: config.gradient?.enabled ? {
          enabled: true,
          gradient_type: config.gradient?.gradient_type || 'linear',
          colors: config.gradient?.colors || ['#000000', '#666666'],
          angle: config.gradient?.angle || 90,
        } : undefined,
        eye_shape: config.eye_shape || 'square',
        data_pattern: config.data_pattern || 'square',
        colors: {
          foreground: config.colors?.foreground || '#000000',
          background: config.colors?.background || '#FFFFFF',
          eye_outer: config.colors?.eye_colors?.outer,
          eye_inner: config.colors?.eye_colors?.inner,
        }
      }
    };

    return {
      barcode_type: 'qrcode',  // Changed from 'type' to 'barcode_type'
      type: 'qrcode',  // Keep both for compatibility
      qr_type: 'link', 
      data: PLACEHOLDER_URL,
      options
    };
  }, [
    config.error_correction,
    config.gradient?.enabled,
    config.gradient?.gradient_type,
    config.gradient?.colors,
    config.gradient?.angle,
    config.eye_shape,
    config.data_pattern,
    config.colors?.foreground,
    config.colors?.background,
    config.colors?.eye_colors?.outer,
    config.colors?.eye_colors?.inner
  ]);

  // Generate QR when config changes - with proper initialization and concurrency control
  useEffect(() => {
    // Prevent concurrent generations
    if (isGenerating) {
      console.log('[PlaceholderPreview] Generation already in progress, skipping');
      return;
    }

    if (!isInitialized) {
      setIsInitialized(true);
      // Generate initial QR after small delay to ensure component is mounted
      const initTimer = setTimeout(async () => {
        setIsGenerating(true);
        try {
          await generateQR(formData);
        } catch (err) {
          console.error('Error generating initial placeholder QR:', err);
          setLocalError('Error generando QR inicial');
        } finally {
          setIsGenerating(false);
        }
      }, 500); // Increased delay for initial load
      return () => clearTimeout(initTimer);
    }

    // Debounce subsequent changes with longer delay
    const timer = setTimeout(async () => {
      if (isGenerating) return; // Double check
      
      setIsGenerating(true);
      setLocalError(null);
      try {
        await generateQR(formData);
      } catch (err) {
        console.error('Error generating placeholder QR:', err);
        setLocalError('Error generando QR');
      } finally {
        setIsGenerating(false);
      }
    }, 800); // Increased debounce time
    
    return () => clearTimeout(timer);
  }, [formData]); // Remove generateQR from deps to avoid infinite loop

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
              disabled={!enhancedData}
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
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ width: viewMode === 'mobile' ? 280 : 320, height: viewMode === 'mobile' ? 280 : 320 }}>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (error || localError) ? (
              <div className="flex items-center justify-center p-8 text-red-600" style={{ width: viewMode === 'mobile' ? 280 : 320, height: viewMode === 'mobile' ? 280 : 320 }}>
                <div className="text-center">
                  <p className="text-sm font-medium">Error generando QR</p>
                  <p className="text-xs mt-1">{error || localError}</p>
                </div>
              </div>
            ) : enhancedData ? (
              <EnhancedQRV3 
                data={enhancedData} 
                size={viewMode === 'mobile' ? 280 : 320}
                totalModules={enhancedData.metadata.total_modules}
                dataModules={enhancedData.metadata.data_modules}
                version={enhancedData.metadata.version}
                errorCorrection={enhancedData.metadata.error_correction}
              />
            ) : null}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
            <Info className="h-4 w-4" />
            <span>URL: {PLACEHOLDER_URL}</span>
          </div>
          
          {enhancedData && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-xs">
                Versión: {enhancedData.metadata.version}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Módulos: {enhancedData.metadata.total_modules}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Tiempo: {enhancedData.metadata.generation_time_ms}ms
              </Badge>
            </div>
          )}
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