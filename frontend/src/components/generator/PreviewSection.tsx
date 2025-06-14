import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, QrCode } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';

interface PreviewSectionProps {
  svgContent: string;
  isLoading: boolean;
  serverError: any;
  selectedType: string;
  data: string;
  gradientOptions: any;
  scale: number;
  onScaleChange: (scale: number) => void;
  isTyping?: boolean;
  isWaitingForValidInput?: boolean;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  svgContent,
  isLoading,
  serverError,
  selectedType,
  data,
  gradientOptions,
  scale,
  onScaleChange,
  isTyping = false,
  isWaitingForValidInput = false,
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, selectedType);

  return (
    <div className="w-full p-0">
      {isTyping && isWaitingForValidInput ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Esperando entrada válida...</p>
          </div>
        </div>
      ) : isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Generando código...</p>
                </div>
              </div>
            ) : serverError ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-700 dark:text-red-400">Error en la generación</p>
                    <p className="text-sm text-red-600 dark:text-red-500">{serverError.error}</p>
                  </div>
                </div>
              </div>
            ) : svgContent ? (
              <div className="space-y-4 w-full">
                  {/* Preview Area */}
                  <div className="flex items-center justify-center min-h-[200px] barcode-container w-full pt-4">
                    <BarcodeDisplay
                      key={selectedType}
                      svgContent={svgContent}
                      type={selectedType}
                      data={data}
                      gradientOptions={gradientOptions}
                    />
                  </div>

                  {/* Control de Calidad */}
                  <div className="space-y-2 px-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Calidad</label>
                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                      {(() => {
                        const size = scale * 100;
                        return `${size} x ${size} px`;
                      })()}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={scale}
                      onChange={(e) => onScaleChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: 'linear-gradient(to right, #e2e8f0 0%, #93c5fd 50%, #3b82f6 100%)',
                      }}
                    />
                    <style jsx>{`
                      input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #3b82f6;
                        border: 3px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        cursor: pointer;
                      }
                      input[type="range"]::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #3b82f6;
                        border: 3px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        cursor: pointer;
                        border: none;
                      }
                    `}</style>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Baja</span>
                      <span>Alta</span>
                    </div>
                  </div>
                </div>

                {/* Título con número 3 */}
                <div className="px-6 mt-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">3</span>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Descargar Código QR</h3>
                  </div>
                </div>

                {/* Botones de Descarga */}
                <div className="grid grid-cols-2 gap-2 px-6 pb-6 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('png')}
                    disabled={!svgContent || isLoading}
                    className="h-9 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PNG
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload('svg')}
                    disabled={!svgContent || isLoading}
                    className="h-9 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    SVG
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('pdf')}
                    disabled={!svgContent || isLoading}
                    className="h-9 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload('eps')}
                    disabled={!svgContent || isLoading}
                    className="h-9 text-sm font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    EPS
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-center">
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto">
                    <QrCode className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Tu código aparecerá aquí</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Configura y genera para ver el resultado</p>
                  </div>
                </div>
              </div>
      )}
    </div>
  );
};