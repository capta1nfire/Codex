import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { DynamicQRCodeFromSVG } from '@/components/DynamicQRCode';
import { EnhancedQRV3 } from '@/components/generator/EnhancedQRV3';
import { QREnhancedData } from '@/components/generator/EnhancedQRV3';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';
import { ScannabilityMeter } from '@/components/generator/ScannabilityMeter';

interface ScannabilityAnalysis {
  score: number;
  issues: Array<{
    type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
    severity: 'warning' | 'error';
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  contrastRatio: number;
}

interface PreviewSectionProps {
  svgContent: string;
  isLoading: boolean;
  barcodeType?: string;
  isUsingV2?: boolean;
  isUsingV3Enhanced?: boolean;
  enhancedData?: QREnhancedData | null;
  scannabilityAnalysis?: ScannabilityAnalysis | null;
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
  urlGenerationState?: string;
  qrData?: string; // The actual data encoded in the QR
  transparentBackground?: boolean; // Whether to show transparent background
  backgroundColor?: string; // The background color from form
}

/**
 * Optimized Preview Section with memoization and reduced re-renders
 * Uses stable references and memoized calculations to prevent excessive renders
 */
const PreviewSectionComponent: React.FC<PreviewSectionProps> = ({
  svgContent,
  isLoading,
  barcodeType = 'qrcode',
  isUsingV3Enhanced = false,
  enhancedData = null,
  scannabilityAnalysis = null,
  urlGenerationState,
  qrData = '', // Add prop to receive the actual QR data
  transparentBackground = false,
  backgroundColor,
  className,
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHeroMoment, setShowHeroMoment] = useState(false);
  const [previousEnhancedData, setPreviousEnhancedData] = useState<QREnhancedData | null>(null);
  const [previousSvgContent, setPreviousSvgContent] = useState<string>('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // UNIVERSAL placeholder detection for ALL barcode types
  const isPlaceholderData = (data: string): boolean => {
    const placeholders = [
      // URL/Link placeholders
      'https://tu-sitio-web.com',
      'tu-sitio-web.com',
      'https://codex.app',
      'codex.app',
      
      // Email placeholders
      'correo@tu-sitio-web.com',
      'contacto@tu-sitio-web.com',
      'email@example.com',
      'usuario@ejemplo.com',
      
      // Phone/SMS/WhatsApp placeholders
      '5555555555',
      '+1234567890',
      '+525555555555',
      
      // WiFi placeholders
      'Mi-Red-WiFi',
      'contraseña123',
      'password123',
      
      // VCard placeholders
      'Nombre Apellido',
      'Mi Empresa',
      'Tu Empresa',
      'Cargo/Título',
      'Calle 123, Ciudad, País 12345',
      
      // Text/Message placeholders
      'Generador Profesional de QR',
      'Generador QR',
      'Asunto del mensaje',
      'Mensaje generado con QR',
      'Mensaje de texto QR',
      'Hola desde QR!',
      'Tu mensaje aquí',
      'Mensaje de ejemplo',
      
      // VCard format detection (common VCard structure)
      'BEGIN:VCARD',
      'VERSION:3.0',
      
      // Common default/example patterns
      'ejemplo',
      'example',
      'placeholder',
      'default',
      'test',
      'demo'
    ];
    
    // Check if the data contains any placeholder value (case insensitive)
    return placeholders.some(placeholder => 
      data.toLowerCase().includes(placeholder.toLowerCase())
    );
  };
  
  // Memoized display state calculations
  const displayState = useMemo(() => {
    // UNIVERSAL LOADING RULE: Show loading animation before ANY code generation
    // - Must be in GENERATING state (actively generating)
    // - Must have real user data (not placeholder/default values)
    // - Applies to ALL barcode types (QR, VCard, SMS, Call, etc.)
    const showUniversalLoading = (urlGenerationState === 'GENERATING') && 
                                qrData && // Must have actual user data
                                !isPlaceholderData(qrData); // Must not be placeholder data
    
    const showLoadingState = showUniversalLoading;
    const hasContent = isUsingV3Enhanced ? enhancedData !== null : svgContent !== '';
    
    // CRITICAL FIX: Ensure mutual exclusivity
    // Priority: Loading > Content > Empty
    const showRealBarcode = hasContent && !showLoadingState;
    const showEmptyState = !hasContent && !showLoadingState;
    
    // DEBUG: Log the exact state transitions
    console.log('[PreviewSection DEBUG] Universal Loading Logic:', {
      isLoading,
      urlGenerationState,
      barcodeType,
      qrData,
      isPlaceholderData: qrData ? isPlaceholderData(qrData) : 'no-data',
      showUniversalLoading,
      showLoadingState,
      hasContent,
      showRealBarcode,
      showEmptyState,
      'UNIVERSAL_LOADING_CRITERIA': {
        'is_generating': urlGenerationState === 'GENERATING',
        'has_data': !!qrData,
        'not_placeholder': qrData ? !isPlaceholderData(qrData) : false,
        'barcode_type': barcodeType
      },
      'MUTUAL_EXCLUSIVITY_CHECK': Number(showLoadingState) + Number(showRealBarcode) + Number(showEmptyState) // Should equal 1
    });
    
    return {
      showUniversalLoading,
      showLoadingState,
      hasContent,
      showRealBarcode,
      showEmptyState,
      willShowEnhancedQR: barcodeType === 'qrcode' && isUsingV3Enhanced && enhancedData !== null
    };
  }, [isLoading, urlGenerationState, barcodeType, isUsingV3Enhanced, enhancedData, svgContent, qrData]);
  
  // Hero moment effect - optimized to prevent multiple triggers
  useEffect(() => {
    // Determine if we have new content
    let hasNewContent = false;
    
    if (barcodeType === 'qrcode' && isUsingV3Enhanced) {
      // For enhanced QR, check if enhancedData changed
      hasNewContent = enhancedData !== null && 
                     enhancedData !== previousEnhancedData && 
                     !isLoading;
      
      if (hasNewContent) {
        setPreviousEnhancedData(enhancedData);
      }
    } else {
      // For regular codes, check if SVG content changed
      hasNewContent = svgContent !== '' && 
                     svgContent !== previousSvgContent && 
                     !isLoading;
      
      if (hasNewContent) {
        setPreviousSvgContent(svgContent);
      }
    }
    
    // Show hero moment only for real user data, not placeholders
    const isRealUserData = qrData && !isPlaceholderData(qrData);
    
    if (hasNewContent && !isFirstLoad && isRealUserData) {
      console.log('[PreviewSectionV3] Showing hero moment for user data:', qrData);
      setShowHeroMoment(true);
      
      const timer = setTimeout(() => {
        setShowHeroMoment(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
    
    if (hasNewContent && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [svgContent, enhancedData, barcodeType, isUsingV3Enhanced, isLoading, isFirstLoad, previousEnhancedData, previousSvgContent, qrData]);
  
  // Video loop logic - memoized callback
  const startVideoCycle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    
    let playTimeoutId: NodeJS.Timeout;
    let pauseTimeoutId: NodeJS.Timeout;
    
    const cycle = () => {
      video.loop = true;
      video.currentTime = 1.0;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Video play error:', error);
          }
        });
      }
      
      playTimeoutId = setTimeout(() => {
        video.pause();
        video.loop = false;
        
        pauseTimeoutId = setTimeout(() => {
          cycle();
        }, 3000);
      }, 2000);
    };
    
    cycle();
    
    return () => {
      clearTimeout(playTimeoutId);
      clearTimeout(pauseTimeoutId);
      if (video) {
        video.pause();
        video.loop = false;
      }
    };
  }, []);
  
  // Video effect - only runs when showEmptyState changes
  useEffect(() => {
    if (!displayState.showEmptyState) return;
    
    const cleanup = startVideoCycle();
    return cleanup || undefined;
  }, [displayState.showEmptyState, startVideoCycle]);
  
  // QR Loading Animation with Blue Corner Graphics
  const loadingSkeleton = useMemo(() => (
    <div className="relative mx-auto w-fit animate-fadeIn">
      <div className="p-6 pb-4 flex justify-center">
        <div className="bg-transparent rounded-lg shadow-lg p-2">
            <div className="w-[300px] h-[300px] rounded flex flex-col items-center justify-center">
              <div className="relative">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {[...Array(25)].map((_, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm bg-slate-200 dark:bg-slate-300 animate-pulse"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        opacity: Math.random() > 0.3 ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                {/* Blue corner borders - QR detection patterns */}
                <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-b-0 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-4 border-blue-600 border-l-0 border-b-0 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-t-0 rounded-bl-lg" />
              </div>
              <p className="text-sm text-slate-600 font-medium mt-6">
                Generando código...
              </p>
            </div>
        </div>
      </div>
    </div>
  ), []);
  
  // Memoized QR display component
  const qrDisplay = useMemo(() => {
    if (!displayState.showRealBarcode) return null;
    
    console.log('[PreviewSectionV3] transparentBackground prop:', transparentBackground);
    console.log('[PreviewSectionV3] isUsingV3Enhanced:', isUsingV3Enhanced);
    console.log('[PreviewSectionV3] barcodeType:', barcodeType);
    
    if ((barcodeType === 'qrcode' || barcodeType === 'qr') && isUsingV3Enhanced && enhancedData) {
      // Extract logo size ratio if available
      const logoSizeRatio = enhancedData.overlays?.logo?.size || undefined;
      
      return (
        <EnhancedQRV3
          data={enhancedData}
          totalModules={enhancedData.metadata.total_modules}
          dataModules={enhancedData.metadata.data_modules}
          version={enhancedData.metadata.version}
          errorCorrection={enhancedData.metadata.error_correction}
          size={326}
          title="Código QR"
          description="Escanea este código QR"
          className="animate-fadeIn"
          logoSizeRatio={logoSizeRatio}
          transparentBackground={transparentBackground}
          backgroundColor={backgroundColor}
        />
      );
    } else if (barcodeType === 'qrcode' || barcodeType === 'qr') {
      return (
        <DynamicQRCodeFromSVG
          svgContent={svgContent}
          size={326}
          className="qr-v3"
          transparentBackground={transparentBackground}
        />
      );
    } else {
      return (
        <BarcodeDisplay
          svgContent={svgContent}
          type={barcodeType}
          data=""
        />
      );
    }
  }, [displayState.showRealBarcode, barcodeType, isUsingV3Enhanced, enhancedData, svgContent]);
  
  // Memoized download handlers
  const handleDownloadPNG = useCallback(() => handleDownload(), [handleDownload]);
  const handleDownloadSVG = useCallback(() => handleDownload('svg'), [handleDownload]);

  return (
    <>
      {/* Loading state */}
      {displayState.showLoadingState && (
        <>
          {console.log('[PreviewSection] 🎯 SHOWING LOADING ANIMATION!')}
          {loadingSkeleton}
        </>
      )}
          
      {/* Real barcode display */}
      {displayState.showRealBarcode && (
        <>
          <div className="relative mx-auto animate-fadeIn">
            <div className="bg-transparent rounded-lg shadow-lg">
              <div className="relative w-[350px] h-[350px] p-2 flex items-center justify-center border-2 border-green-600">
                <div className="w-full h-full flex items-center justify-center">
                  {qrDisplay}
                </div>
                {/* Indicador de quiet zone - ahora encima del QR */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-green-400 opacity-30"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-400 opacity-30"></div>
                  <div className="absolute top-0 left-0 bottom-0 w-2 bg-green-400 opacity-30"></div>
                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-green-400 opacity-30"></div>
                  <span className="absolute top-2 left-2 text-xs text-green-700 font-semibold bg-white bg-opacity-90 px-1 rounded">ISO/IEC 18004</span>
                </div>
              </div>
              
              {/* Hero moment checkmark */}
              {showHeroMoment && (
                <div className="absolute -top-2 -right-2 animate-subtleSuccess z-60">
                  <div className="bg-green-500 text-white rounded-full p-1 shadow-md">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              )}
                
                {/* Download actions */}
                <div className="p-4 space-y-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleDownloadPNG}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-200 ${
                    svgContent ? 'animate-pulse-subtle' : ''
                  }`}
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PNG
                </Button>
                <Button
                  onClick={handleDownloadSVG}
                  variant="outline"
                  className="flex-1"
                  disabled={!svgContent}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar SVG
                </Button>
              </div>
              
              {/* Scannability Analysis - only show for QR codes with customizations */}
              {(() => {
                console.log('[ScannabilityMeter Debug] barcodeType:', barcodeType);
                console.log('[ScannabilityMeter Debug] scannabilityAnalysis:', scannabilityAnalysis);
                console.log('[ScannabilityMeter Debug] Should show:', barcodeType === 'qrcode' && scannabilityAnalysis);
                
                return barcodeType === 'qrcode' && scannabilityAnalysis && (
                  <div className="mx-auto">
                    <ScannabilityMeter 
                      analysis={scannabilityAnalysis}
                      isLoading={isLoading}
                    />
                  </div>
                );
              })()}
                </div>
              </div>
            </div>
        </>
      )}
      
      {/* Empty state with video placeholder */}
      {displayState.showEmptyState && (
        <div className="relative mx-auto w-fit animate-fadeIn">
          <div className="p-6 pb-4 flex justify-center">
            <div className="bg-transparent rounded-lg shadow-lg p-2">
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

// Deep comparison function for props
const arePropsEqual = (prevProps: PreviewSectionProps, nextProps: PreviewSectionProps): boolean => {
  // Basic value comparisons
  if (prevProps.svgContent !== nextProps.svgContent) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.barcodeType !== nextProps.barcodeType) return false;
  if (prevProps.isUsingV3Enhanced !== nextProps.isUsingV3Enhanced) return false;
  if (prevProps.urlGenerationState !== nextProps.urlGenerationState) return false;
  
  // Enhanced data comparison
  if (prevProps.isUsingV3Enhanced && nextProps.isUsingV3Enhanced) {
    // For v3 enhanced, compare enhanced data
    const prevData = prevProps.enhancedData;
    const nextData = nextProps.enhancedData;
    
    if ((prevData === null) !== (nextData === null)) return false;
    
    if (prevData && nextData) {
      // Compare by stringifying the data (deep comparison)
      if (JSON.stringify(prevData) !== JSON.stringify(nextData)) return false;
    }
  }
  
  // Scannability analysis comparison
  const prevAnalysis = prevProps.scannabilityAnalysis;
  const nextAnalysis = nextProps.scannabilityAnalysis;
  
  if ((prevAnalysis === null) !== (nextAnalysis === null)) return false;
  
  if (prevAnalysis && nextAnalysis) {
    // Compare by stringifying the analysis (deep comparison)
    if (JSON.stringify(prevAnalysis) !== JSON.stringify(nextAnalysis)) return false;
  }
  
  return true;
};

// Export memoized component
export const PreviewSection = React.memo(PreviewSectionComponent, arePropsEqual);