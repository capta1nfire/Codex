import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, Zap, Database } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';

interface PreviewSectionProps {
  svgContent: string;
  isLoading: boolean;
  barcodeType?: string;
  isUsingV2?: boolean;
  showCacheIndicator?: boolean;
  gradientOptions?: {
    enabled: boolean;
    type?: string;
    direction?: string;
    colors?: string[];
    applyBorders?: boolean;
  };
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  svgContent,
  isLoading,
  barcodeType = 'qrcode',
  isUsingV2 = false,
  showCacheIndicator = false,
  gradientOptions,
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);

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
                Resultado en tiempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
          {isLoading ? (
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
          ) : svgContent ? (
            <div className="space-y-4">
              {/* Barcode display with better centering */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                  <BarcodeDisplay
                    svgContent={svgContent}
                    type={barcodeType}
                    data=""
                    gradientOptions={gradientOptions}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  onClick={() => handleDownload()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PNG
                </Button>
                <Button
                  onClick={() => handleDownload('svg')}
                  variant="outline"
                  className="flex-1"
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar SVG
                </Button>
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
          ) : (
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