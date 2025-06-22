import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';
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
  isUsingV3Enhanced?: boolean;
  enhancedData?: QREnhancedData | null;
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
  urlGenerationState,
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHeroMoment, setShowHeroMoment] = useState(false);
  const [previousEnhancedData, setPreviousEnhancedData] = useState<QREnhancedData | null>(null);
  const [previousSvgContent, setPreviousSvgContent] = useState<string>('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Memoized display state calculations
  const displayState = useMemo(() => {
    const showUrlValidationLoading = (urlGenerationState === 'READY_TO_GENERATE' || urlGenerationState === 'GENERATING') && barcodeType === 'qrcode';
    const showLoadingState = isLoading || showUrlValidationLoading;
    const hasContent = isUsingV3Enhanced ? enhancedData !== null : svgContent !== '';
    const showRealBarcode = !showLoadingState && hasContent;
    const showEmptyState = !showLoadingState && !showRealBarcode && !hasContent;
    
    return {
      showUrlValidationLoading,
      showLoadingState,
      hasContent,
      showRealBarcode,
      showEmptyState,
      willShowEnhancedQR: barcodeType === 'qrcode' && isUsingV3Enhanced && enhancedData !== null
    };
  }, [isLoading, urlGenerationState, barcodeType, isUsingV3Enhanced, enhancedData, svgContent]);
  
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
    
    // Show hero moment only for subsequent generations
    if (hasNewContent && !isFirstLoad) {
      setShowHeroMoment(true);
      
      const timer = setTimeout(() => {
        setShowHeroMoment(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
    
    if (hasNewContent && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [svgContent, enhancedData, barcodeType, isUsingV3Enhanced, isLoading, isFirstLoad, previousEnhancedData, previousSvgContent]);
  
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
  
  // Memoized loading skeleton
  const loadingSkeleton = useMemo(() => (
    <div className="mx-auto w-fit animate-fadeIn">
      <div className="p-6 pb-4 flex justify-center">
        <div className="bg-white dark:bg-white rounded-lg p-2 shadow-sm">
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
              <div className="absolute top-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-b-0 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-4 border-blue-600 border-l-0 border-b-0 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-blue-600 border-r-0 border-t-0 rounded-bl-lg" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-6">
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
    
    if ((barcodeType === 'qrcode' || barcodeType === 'qr') && isUsingV3Enhanced && enhancedData) {
      return (
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
      );
    } else if (barcodeType === 'qrcode' || barcodeType === 'qr') {
      return (
        <DynamicQRCodeFromSVG
          svgContent={svgContent}
          size={300}
          className="qr-ultrathink"
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
      {displayState.showLoadingState && loadingSkeleton}
          
      {/* Real barcode display */}
      {displayState.showRealBarcode && (
        <div className="mx-auto w-fit animate-fadeIn">
          <div className="p-6 pb-4 flex justify-center">
            <div className="bg-white dark:bg-white rounded-lg p-2 shadow-sm relative">
              {qrDisplay}
              
              {/* Hero moment checkmark */}
              {showHeroMoment && (
                <div className="absolute -top-2 -right-2 animate-subtleSuccess">
                  <div className="bg-green-500 text-white rounded-full p-1 shadow-md">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Download actions */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-2 max-w-[320px] mx-auto">
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
          </div>
        </div>
      )}
      
      {/* Empty state with video placeholder */}
      {displayState.showEmptyState && (
        <div className="mx-auto w-fit animate-fadeIn">
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
  
  return true;
};

// Export memoized component
export const PreviewSection = React.memo(PreviewSectionComponent, arePropsEqual);