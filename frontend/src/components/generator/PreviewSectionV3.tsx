import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, Zap, Database, Keyboard, CheckCircle } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';
import { QRPlaceholder } from './QRPlaceholder';

interface PreviewSectionProps {
  svgContent: string;
  isLoading: boolean;
  barcodeType?: string;
  isUsingV2?: boolean;
  showCacheIndicator?: boolean;
  isUserTyping?: boolean;
  validationError?: string | null;
  isInitialDisplay?: boolean;
  gradientOptions?: {
    enabled: boolean;
    type?: string;
    direction?: string;
    colors?: string[];
    applyBorders?: boolean;
  };
}

/**
 * Enhanced Preview Section with sophisticated placeholder system
 * Shows a static QR mockup while user is typing, real QR after debounce
 */
export const PreviewSection: React.FC<PreviewSectionProps> = ({
  svgContent,
  isLoading,
  barcodeType = 'qrcode',
  isUsingV2 = false,
  showCacheIndicator = false,
  isUserTyping = false,
  validationError = null,
  isInitialDisplay = false,
  gradientOptions,
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);
  
  // Determine what to show
  const showPlaceholder = isUserTyping && barcodeType === 'qrcode' && !isInitialDisplay;
  const showRealBarcode = svgContent && (!isUserTyping || isInitialDisplay) && !isLoading;
  const showLoadingState = isLoading && !isUserTyping;

  return (
    <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Vista Previa
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isUserTyping ? 'Escribiendo...' : svgContent ? 'Listo para descargar' : 'Resultado en tiempo real'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isUserTyping && (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                <Keyboard className="w-3 h-3" />
                Typing
              </Badge>
            )}
            {isUsingV2 && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                v2
              </Badge>
            )}
            {showCacheIndicator && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                <Database className="w-3 h-3" />
                Cached
              </Badge>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="bg-white dark:bg-slate-950 p-8">
          {/* Loading state */}
          {showLoadingState && (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Generando código...
                </p>
              </div>
            </div>
          )}
          
          {/* Placeholder while typing */}
          {showPlaceholder && (
            <div className="flex flex-col items-center justify-center min-h-[300px] transition-all duration-300">
              <QRPlaceholder 
                size={256} 
                isTyping={isUserTyping}
                className="mb-4"
              />
              
              {/* Validation feedback */}
              {validationError && (
                <div className="mt-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {validationError}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Real barcode display */}
          {showRealBarcode && (
            <div className="space-y-4 transition-all duration-300 animate-fadeIn">
              {/* Barcode display with better centering */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                  <BarcodeDisplay
                    svgContent={svgContent}
                    type={barcodeType}
                    data=""
                  />
                </div>
              </div>

              {/* Actions with enhanced status */}
              <div className="space-y-3">
                {/* Ready indicator */}
                {svgContent && !isUserTyping && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 py-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">¡Código listo para descargar!</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => handleDownload()}
                    className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 ${
                      svgContent && !isUserTyping ? 'animate-pulse-subtle' : ''
                    }`}
                    disabled={!svgContent || isUserTyping}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PNG
                  </Button>
                  <Button
                    onClick={() => handleDownload('svg')}
                    variant="outline"
                    className="flex-1"
                    disabled={!svgContent || isUserTyping}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar SVG
                  </Button>
                </div>
              </div>

              {/* Quality indicator */}
              <div className="flex items-center justify-center pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <span>Alta calidad</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty state (no content, not typing) */}
          {!svgContent && !isLoading && !isUserTyping && (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <QrCode className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Sin vista previa
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Configura las opciones para generar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add fade-in animation to globals.css if not already present
const fadeInKeyframes = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;