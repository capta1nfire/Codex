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

      {/* Área de preview - QR Studio design workshop with larger size */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[500px]">
          <div className="relative animate-fadeIn">
            <div className="bg-transparent rounded-lg w-[500px]">
              <div className="relative w-[500px] h-[500px] flex items-center justify-center">
              {/* Dynamic background layer - larger for studio */}
              {enhancedData && !config.transparent_background && (
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: config.colors?.background || '#FFFFFF' }}
                />
              )}
              
              {/* Glass frame effect for transparent background */}
              {enhancedData && config.transparent_background && (
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              )}
              
              {/* QR container - larger for studio design */}
              <div className="relative w-[480px] h-[480px] flex items-center justify-center overflow-visible z-10 rounded-lg">
                {isLoading ? (
                  <div 
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{ backgroundColor: config.transparent_background ? 'transparent' : (config.colors?.background || '#FFFFFF') }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="grid grid-cols-5 gap-2 p-2">
                        {[...Array(25)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-sm bg-slate-200 dark:bg-slate-300 animate-pulse"
                            style={{
                              animationDelay: `${i * 50}ms`,
                              opacity: Math.random() > 0.3 ? 1 : 0.3
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 font-medium mt-4">
                        Generando código...
                      </p>
                    </div>
                  </div>
                ) : (error || localError) ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-red-600">
                    <div className="text-center">
                      <p className="text-sm font-medium">Error generando QR</p>
                      <p className="text-xs mt-1">{error || localError}</p>
                    </div>
                  </div>
                ) : enhancedData ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <EnhancedQRV3 
                      data={enhancedData} 
                      size={470}
                      totalModules={enhancedData.metadata.total_modules}
                      dataModules={enhancedData.metadata.data_modules}
                      version={enhancedData.metadata.version}
                      errorCorrection={enhancedData.metadata.error_correction}
                      transparentBackground={config.transparent_background}
                      backgroundColor={config.colors?.background || '#FFFFFF'}
                      logoSizeRatio={enhancedData.overlays?.logo?.size || undefined}
                    />
                  </div>
                ) : null}
                </div>
              </div>
            </div>
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