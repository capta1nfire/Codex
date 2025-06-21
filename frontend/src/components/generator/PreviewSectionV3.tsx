import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, Zap, Database, Keyboard, CheckCircle, Sparkles } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { DynamicQRCodeFromSVG } from '@/components/DynamicQRCode';
import { EnhancedUltrathinkQR } from '@/components/generator/EnhancedUltrathinkQR';
import { QREnhancedData } from '@/components/generator/EnhancedUltrathinkQR';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';

interface PreviewSectionProps {
  svgContent: string;
  isLoading: boolean;
  barcodeType?: string;
  isUsingV2?: boolean;
  isUsingV3Enhanced?: boolean; // Indica si se está usando v3 Enhanced
  enhancedData?: QREnhancedData | null; // Datos enhanced de v3
  showCacheIndicator?: boolean;
  isUserTyping?: boolean;
  validationError?: string | null;
  isInitialDisplay?: boolean;
  className?: string;
  gradientOptions?: {
    enabled: boolean;
    type?: string;
    direction?: string;
    colors?: string[];
    applyBorders?: boolean;
  };
  urlGenerationState?: string; // State from useUrlGenerationState
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
  isUsingV3Enhanced = false,
  enhancedData = null,
  showCacheIndicator = false,
  isUserTyping = false,
  validationError = null,
  isInitialDisplay = false,
  className = '',
  gradientOptions,
  urlGenerationState,
}) => {
  console.log('[PreviewSection] Received props:', {
    hasSvgContent: !!svgContent,
    svgContentLength: svgContent?.length,
    isLoading,
    barcodeType,
    isUsingV3Enhanced,
    hasEnhancedData: !!enhancedData
  });
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHeroMoment, setShowHeroMoment] = useState(false);
  const [previousSvgContent, setPreviousSvgContent] = useState(svgContent);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Determine what to show - enhanced logic with URL generation state and v3
  const showUrlValidationLoading = (urlGenerationState === 'READY_TO_GENERATE' || urlGenerationState === 'GENERATING') && barcodeType === 'qrcode';
  const showLoadingState = isLoading || showUrlValidationLoading;
  const hasContent = isUsingV3Enhanced ? enhancedData !== null : svgContent !== '';
  const showRealBarcode = !showLoadingState && hasContent;
  const showEmptyState = !showLoadingState && !showRealBarcode && !hasContent;
  
  // Debug which component will be shown
  console.log('[PreviewSection] Component to show:', {
    showLoadingState,
    showRealBarcode,
    showEmptyState,
    willShowEnhancedQR: barcodeType === 'qrcode' && isUsingV3Enhanced && enhancedData !== null
  });
  
  // Additional debug for v3 Enhanced
  if (barcodeType === 'qrcode' && isUsingV3Enhanced) {
    console.log('[PreviewSection] v3 Enhanced Debug:', {
      hasEnhancedData: !!enhancedData,
      enhancedDataKeys: enhancedData ? Object.keys(enhancedData) : null,
      willRenderEnhancedQR: showRealBarcode && !!enhancedData
    });
  }
  
  console.log('[PreviewSection] Display states:', {
    showUrlValidationLoading,
    showLoadingState,
    hasContent,
    showRealBarcode,
    showEmptyState,
    urlGenerationState,
    svgContentEmpty: svgContent === '',
    svgContentNull: svgContent === null,
    svgContentUndefined: svgContent === undefined,
    svgContentType: typeof svgContent
  });
  
  // Detect when new QR code is generated
  useEffect(() => {
    if (svgContent && svgContent !== previousSvgContent && !isLoading) {
      // Don't show hero moment on first load
      if (!isFirstLoad) {
        setShowHeroMoment(true);
        
        // Note: Audio is now played from page.tsx when QR generation starts
        // This ensures better sync with the 2-second validation delay
        
        // Hide hero moment after animation completes
        const timer = setTimeout(() => {
          setShowHeroMoment(false);
        }, 4000); // Extended to 4 seconds for better visibility
        
        return () => clearTimeout(timer);
      }
      setPreviousSvgContent(svgContent);
      setIsFirstLoad(false);
    }
  }, [svgContent, previousSvgContent, isLoading, isFirstLoad]);
  
  // VIDEO LOOP LOGIC: Creates a sophisticated placeholder experience
  // The 2-second video loops from 1s mark, creating seamless animation
  // Pattern: Play 2s → Pause 3s → Repeat (5s total cycle)
  useEffect(() => {
    console.log('[PreviewSection] Video effect running, showEmptyState:', showEmptyState);
    if (!showEmptyState) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    let playTimeoutId: NodeJS.Timeout;
    let pauseTimeoutId: NodeJS.Timeout;
    
    const startCycle = () => {
      // Enable loop and start from second 1 to avoid jarring start
      video.loop = true;
      video.currentTime = 1.0;
      
      // Handle play promise to avoid errors
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Ignore AbortError as it's expected when component unmounts
          if (error.name !== 'AbortError') {
            console.error('Video play error:', error);
          }
        });
      }
      
      // After 2 seconds (1->2->0->1), pause the video
      playTimeoutId = setTimeout(() => {
        video.pause();
        video.loop = false;
        
        // Wait 3 seconds, then restart
        pauseTimeoutId = setTimeout(() => {
          startCycle();
        }, 3000);
      }, 2000); // 2 seconds of playback
    };
    
    // Start the first cycle
    startCycle();
    
    return () => {
      clearTimeout(playTimeoutId);
      clearTimeout(pauseTimeoutId);
      if (video) {
        video.pause();
        video.loop = false;
      }
    };
  }, [showEmptyState]);

  return (
    <>
      {/* Loading state */}
      {showLoadingState && (
        <div className={`${className} mx-auto w-fit animate-fadeIn`}>
          <div className="p-6 pb-4 flex justify-center">
            <div className="bg-white dark:bg-white rounded-lg p-2 shadow-sm">
              <div className="w-[300px] h-[300px] rounded flex flex-col items-center justify-center">
                {/* Opción 1: Spinner circular clásico (actual) */}
                {/*
                <div className="relative inline-block">
                  <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                */}
                
                {/* Opción 2: Puntos pulsantes */}
                {/*
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-75"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                </div>
                */}
                
                {/* Opción 3: QR Code skeleton animado */}
                <div className="relative">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {[...Array(25)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-sm bg-slate-200 dark:bg-slate-300 animate-pulse`}
                        style={{
                          animationDelay: `${i * 50}ms`,
                          opacity: Math.random() > 0.3 ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  {/* Corner markers like QR */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-b-0 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-4 border-blue-600 border-l-0 border-b-0 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-t-0 rounded-bl-lg"></div>
                </div>
                
                {/* Opción 4: Barras de carga tipo ecualizador */}
                {/*
                <div className="flex items-end space-x-1 h-16">
                  <div className="w-3 bg-blue-600 rounded-t animate-pulse" style={{height: '40%'}}></div>
                  <div className="w-3 bg-blue-600 rounded-t animate-pulse delay-75" style={{height: '60%'}}></div>
                  <div className="w-3 bg-blue-600 rounded-t animate-pulse delay-150" style={{height: '80%'}}></div>
                  <div className="w-3 bg-blue-600 rounded-t animate-pulse delay-200" style={{height: '60%'}}></div>
                  <div className="w-3 bg-blue-600 rounded-t animate-pulse delay-300" style={{height: '40%'}}></div>
                </div>
                */}
                
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-6">
                  Generando código...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
          
      {/* Real barcode display */}
      {showRealBarcode && (
        <div className={`${className} mx-auto w-fit animate-fadeIn`}>
          {/* QR Code */}
          <div className="p-6 pb-4 flex justify-center">
            <div className="bg-white dark:bg-white rounded-lg p-2 shadow-sm relative">
              {/* Renderizar según la versión disponible */}
              {(barcodeType === 'qrcode' || barcodeType === 'qr') ? (
                isUsingV3Enhanced && enhancedData ? (
                  // V3 Enhanced: Usar EnhancedUltrathinkQR con datos enhanced
                  <EnhancedUltrathinkQR
                    data={enhancedData}
                    totalModules={enhancedData.metadata.total_modules}
                    dataModules={enhancedData.metadata.data_modules}
                    version={enhancedData.metadata.version}
                    errorCorrection={enhancedData.metadata.error_correction}
                    size={300}
                    title="Código QR"
                    description="Escanea este código QR"
                    className="animate-fadeIn"
                  />
                ) : (
                  // V2 o fallback: Usar DynamicQRCodeFromSVG
                  <DynamicQRCodeFromSVG
                    svgContent={svgContent}
                    size={300}
                    className="qr-ultrathink"
                  />
                )
              ) : (
                // Otros tipos de código de barras
                <BarcodeDisplay
                  svgContent={svgContent}
                  type={barcodeType}
                  data=""
                />
              )}
              
              {/* Subtle hero moment - just a checkmark */}
              {showHeroMoment && (
                <div className="absolute -top-2 -right-2 animate-subtleSuccess">
                  <div className="bg-green-500 text-white rounded-full p-1 shadow-md">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions in subcard */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-2 max-w-[320px] mx-auto">
                <Button
                  onClick={() => handleDownload()}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 ${
                    svgContent ? 'animate-pulse-subtle' : ''
                  }`}
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
            </div>
        </div>
      )}
      
      {/* Empty state (no content, not typing) - Show video placeholder */}
      {showEmptyState && (
        <div className={`${className} mx-auto w-fit animate-fadeIn`}>
          <div className="p-6 pb-4 flex justify-center">
            <div className="bg-white dark:bg-white rounded-lg p-2 shadow-sm">
              <video
                ref={videoRef}
                muted
                playsInline
                loop
                className="w-[300px] h-[300px] rounded"
                src="/assets/videos/qr-placeholder.mp4"
              />
            </div>
          </div>
        </div>
      )}
    </>
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

/* Estilos de impresión para QR ultrathink */
@media print {
  .qr-ultrathink svg path,
  .qr-ultrathink svg rect {
    fill: #000000 !important;
    shape-rendering: crispEdges !important;
  }
}
`;