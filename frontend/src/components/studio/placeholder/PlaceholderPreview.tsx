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
  viewMode?: 'desktop' | 'mobile';
  onDownload?: () => void;
  onMetadataChange?: (metadata: any) => void;
  renderControls?: (props: {
    viewMode: 'desktop' | 'mobile';
    setViewMode: (mode: 'desktop' | 'mobile') => void;
    handleCopyConfig: () => void;
    handleDownload: () => void;
    copied: boolean;
    enhancedData: any;
  }) => React.ReactNode;
}

// URL placeholder que se usa en la página principal
const PLACEHOLDER_URL = 'https://tu-sitio-web.com';

export function PlaceholderPreview({ 
  config, 
  showControls = true,
  viewMode: viewModeProp,
  onDownload,
  onMetadataChange,
  renderControls
}: PlaceholderPreviewProps) {
  const [internalViewMode, setInternalViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastConfigHash, setLastConfigHash] = useState<string>('');
  
  // Usar viewMode del prop si se proporciona, sino usar el estado interno
  const viewMode = viewModeProp || internalViewMode;
  const setViewMode = viewModeProp ? () => {} : setInternalViewMode;
  
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
      // ✅ Mapear a formato de formulario con estilos separados
      ecl: config.error_correction || 'M',
      use_separated_eye_styles: config.use_separated_eye_styles ?? true,  // Default true como página principal
      ...(config.use_separated_eye_styles ? {
        eye_border_style: config.eye_border_style || 'circle',
        eye_center_style: config.eye_center_style || 'circle',
      } : {
        eye_shape: config.eye_shape || 'square',
      }),
      data_pattern: config.data_pattern || 'dots',
      gradient_enabled: config.gradient?.enabled ?? true,
      gradient_type: config.gradient?.gradient_type || 'radial',
      gradient_color1: config.gradient?.colors?.[0] || '#2563EB',
      gradient_color2: config.gradient?.colors?.[1] || '#000000',
      gradient_direction: 'top-bottom',
      gradient_apply_to_eyes: config.gradient?.apply_to_eyes ?? true,  // ✅ Agregar para heredar gradiente en ojos
      gradient_per_module: config.gradient?.per_module || false,  // ✅ Por módulo
      gradient_borders: config.gradient?.stroke_style?.enabled || false,  // ✅ Bordes
      fgcolor: config.colors?.foreground || '#000000',
      bgcolor: config.colors?.background || '#FFFFFF',
      transparent_background: config.transparent_background || false,  // ✅ Fondo transparente
      eye_colors: config.colors?.eye_colors,
      // ✅ Configurar modo de color para que los ojos hereden el gradiente
      eye_border_color_mode: 'inherit',
      eye_center_color_mode: 'inherit',
    };

    // Map additional options
    if (config.border) {
      options.border_size = config.border.size;
      options.border_color = config.border.color;
    }

    if (config.logo) {
      options.logo_image = config.logo.image;
      options.logo_size = config.logo.size;
      options.logo_background = config.logo.background;
    }

    if (config.gradient?.stroke_style) {
      options.gradient_stroke_width = config.gradient.stroke_style.width;
      options.gradient_stroke_blend_mode = config.gradient.stroke_style.blend_mode;
    }

    return {
      data: PLACEHOLDER_URL,
      barcode_type: 'qrcode',
      version: 'v3',
      options
    };
  }, [config]);

  // Initialize preview on mount and config changes
  useEffect(() => {
    // Only generate when config actually changes
    const configHash = JSON.stringify(formData);
    
    if (configHash !== lastConfigHash && !isGenerating) {
      setLastConfigHash(configHash);
      setIsGenerating(true);
      setLocalError(null);
      generateQR(formData).finally(() => {
        setIsGenerating(false);
      });
    }
  }, [formData, lastConfigHash, isGenerating, generateQR]);

  // Notify parent when metadata changes
  useEffect(() => {
    if (enhancedData?.metadata && onMetadataChange) {
      onMetadataChange(enhancedData.metadata);
    }
  }, [enhancedData, onMetadataChange]);

  // Descargar QR como SVG
  const handleDownload = () => {
    if (!enhancedData) return;
    
    try {
      const blob = new Blob([enhancedData.svg_data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qr-placeholder.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('QR descargado exitosamente');
    } catch (err) {
      toast.error('Error al descargar el QR');
    }
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
    <div className="h-full flex flex-col">
      {/* Controles - Si se proporciona renderControls, usarlo, sino usar los controles por defecto */}
      {showControls && renderControls ? (
        renderControls({
          viewMode,
          setViewMode,
          handleCopyConfig,
          handleDownload,
          copied,
          enhancedData
        })
      ) : showControls ? (
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
      ) : null}

      {/* Área de preview */}
      <div className={`
        relative bg-gradient-to-br from-slate-50 to-slate-100 
        ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}
        p-4 rounded-lg w-[95%] mx-auto flex-1 flex flex-col
      `}>

        {/* QR Code */}
        <div className="relative flex-1 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            ) : (error || localError) ? (
              <div className="w-full h-full flex items-center justify-center p-8 text-red-600">
                <div className="text-center">
                  <p className="text-sm font-medium">Error generando QR</p>
                  <p className="text-xs mt-1">{error || localError}</p>
                </div>
              </div>
            ) : enhancedData ? (
              <EnhancedQRV3 
                data={enhancedData} 
                size={500}
                totalModules={enhancedData.metadata.total_modules}
                dataModules={enhancedData.metadata.data_modules}
                version={enhancedData.metadata.version}
                errorCorrection={enhancedData.metadata.error_correction}
              />
            ) : null}
          </div>
        </div>

      </div>
      
      {/* Botón oculto para descarga que puede ser activado desde fuera */}
      {!showControls && (
        <button
          data-download-internal
          onClick={handleDownload}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}