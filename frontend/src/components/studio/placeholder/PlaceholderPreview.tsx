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
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useQRGenerationState } from '@/hooks/useQRGenerationState';
import { GenerateFormData } from '@/schemas/generate.schema';
import { useStudioConfigToCustomization } from '@/hooks/useStudioConfigToCustomization';
import { useQRGenerationV3Enhanced } from '@/hooks/useQRGenerationV3Enhanced';

interface PlaceholderPreviewProps {
  config: QRConfig;
  showControls?: boolean;
  onDownload?: () => void;
  onMetadataChange?: (metadata: any) => void;
  renderControls?: (props: {
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
  onDownload,
  onMetadataChange,
  renderControls
}: PlaceholderPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastConfigHash, setLastConfigHash] = useState<string>('');
  
  // Use the QR generation hooks
  const v3Enhanced = useQRGenerationV3Enhanced();
  const customization = useStudioConfigToCustomization(config);

  // Get enhanced data and loading state from v3Enhanced hook
  const { enhancedData, isLoading, error, metadata } = v3Enhanced;

  // Initialize preview on mount and config changes
  useEffect(() => {
    // Only generate when customization actually changes
    const configHash = JSON.stringify(customization);
    
    if (configHash !== lastConfigHash && !isGenerating) {
      setLastConfigHash(configHash);
      setIsGenerating(true);
      setLocalError(null);
      
      v3Enhanced.generateEnhancedQR(PLACEHOLDER_URL, {
        error_correction: config.error_correction || 'M',
        customization
      }).finally(() => {
        setIsGenerating(false);
      });
    }
  }, [customization, config.error_correction, lastConfigHash, isGenerating, v3Enhanced]);

  // Notify parent when metadata changes
  useEffect(() => {
    if (metadata && onMetadataChange) {
      onMetadataChange(metadata);
    }
  }, [metadata, onMetadataChange]);

  // Descargar QR como SVG
  const handleDownload = () => {
    if (!v3Enhanced.svgData) return;
    
    try {
      const blob = new Blob([v3Enhanced.svgData], { type: 'image/svg+xml' });
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
          handleCopyConfig,
          handleDownload,
          copied,
          enhancedData
        })
      ) : showControls ? (
        <div className="flex items-center justify-between p-4 border-b">
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
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg w-[95%] mx-auto flex-1 flex flex-col">

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
                transparentBackground={config.transparent_background}
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