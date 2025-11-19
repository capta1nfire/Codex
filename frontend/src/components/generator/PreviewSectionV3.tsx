import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import BarcodeDisplay from '@/app/BarcodeDisplay';
import { DynamicQRCodeFromSVG } from '@/components/DynamicQRCode';
import { EnhancedQRV3 } from '@/components/generator/EnhancedQRV3';
import { QREnhancedData } from '@/components/generator/EnhancedQRV3';
import { useBarcodeActions } from '@/hooks/useBarcodeActions';
import { HeroScannabilityDisplay } from '@/components/generator/HeroScannabilityDisplay';

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
}) => {
  const { handleDownload } = useBarcodeActions(svgContent, barcodeType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enhancedQRRef = useRef<HTMLDivElement>(null);
  const [isNewGeneration, setIsNewGeneration] = useState(false);
  const [previousEnhancedData, setPreviousEnhancedData] = useState<QREnhancedData | null>(null);
  const [previousSvgContent, setPreviousSvgContent] = useState<string>('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Hero moment effect - simplified
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
    
    if (hasNewContent && !isFirstLoad && isRealUserData && barcodeType === 'qrcode') {
      console.log('[PreviewSectionV3] New generation for real user data:', qrData);
      setIsNewGeneration(true);
      
      // Reset flag after a short delay to allow component to register it
      const timer = setTimeout(() => {
        setIsNewGeneration(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    if (hasNewContent && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [svgContent, enhancedData, barcodeType, isUsingV3Enhanced, isLoading, isFirstLoad, previousEnhancedData, previousSvgContent, qrData]);

  // Overlay auto-show/hide logic - removed automatic showing
  useEffect(() => {
    // Only show overlay on hover, not automatically
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);
  
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
  
  // Loading skeleton removed - unused
  
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
        <div ref={enhancedQRRef}>
          <EnhancedQRV3
            data={enhancedData}
            totalModules={enhancedData.metadata.total_modules}
            dataModules={enhancedData.metadata.data_modules}
            version={enhancedData.metadata.version}
            errorCorrection={enhancedData.metadata.error_correction}
            size={310} // ⚠️ CRÍTICO: Tamaño exacto calibrado - NO MODIFICAR
            title="Código QR"
            description="Escanea este código QR"
            className="animate-fadeIn"
            logoSizeRatio={logoSizeRatio}
            transparentBackground={transparentBackground}
            backgroundColor={backgroundColor}
          />
        </div>
      );
    } else if (barcodeType === 'qrcode' || barcodeType === 'qr') {
      return (
        <DynamicQRCodeFromSVG
          svgContent={svgContent}
          size={310} // ⚠️ CRÍTICO: Tamaño exacto calibrado - NO MODIFICAR
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
  
  // Enhanced download handlers for v3
  const extractSVGFromDOM = useCallback(() => {
    if (!enhancedQRRef.current) return null;
    const svgElement = enhancedQRRef.current.querySelector('svg');
    if (!svgElement) return null;
    
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    // Get the outer HTML
    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    return svgString;
  }, []);

  const handleDownloadPNG = useCallback(() => {
    if (isUsingV3Enhanced && enhancedData) {
      const svgString = extractSVGFromDOM();
      if (svgString) {
        // Create a temporary hook instance with the extracted SVG
        const tempDownload = (format: string = 'png') => {
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          
          if (format === 'png') {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 1024; // High resolution
              canvas.height = 1024;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Only fill with white if not transparent background
                if (!transparentBackground) {
                  ctx.fillStyle = backgroundColor || 'white';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `qr_${Date.now()}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }
                }, 'image/png');
              }
              URL.revokeObjectURL(svgUrl);
            };
            img.src = svgUrl;
          }
        };
        tempDownload('png');
      }
    } else {
      handleDownload();
    }
  }, [isUsingV3Enhanced, enhancedData, extractSVGFromDOM, handleDownload]);

  const handleDownloadSVG = useCallback(() => {
    if (isUsingV3Enhanced && enhancedData) {
      const svgString = extractSVGFromDOM();
      if (svgString) {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr_${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      handleDownload('svg');
    }
  }, [isUsingV3Enhanced, enhancedData, extractSVGFromDOM, handleDownload]);

  return (
    <div className="w-[350px]">
      {/* ⚠️ ESTRUCTURA CRÍTICA - NO MODIFICAR SIN AUTORIZACIÓN
          Esta configuración fue cuidadosamente calibrada durante una sesión completa de trabajo.
          
          DIMENSIONES PROTEGIDAS:
          - Contenedor principal: w-[350px] - NO CAMBIAR
          - Contenedor QR: w-[320px] h-[320px] - CRÍTICO para alineación
          - QR size: 310px - OPTIMIZADO para spacing
          
          Cualquier cambio puede romper:
          - Alineación del QR
          - Fondo blanco redondeado
          - Overlay de descarga
          - Comportamiento del video placeholder
      */}
      {/* Main container structure - always present */}
      <div className="relative animate-fadeIn">
        <div className="bg-transparent rounded-lg w-[350px]">
          <div className="relative w-[350px] h-[350px] flex items-center justify-center">
            {/* ⚠️ CAPA DE FONDO CRÍTICA - AHORA DINÁMICA
                - Posición: DEBE estar fuera del overflow container
                - Dimensiones: 320x320px exactos
                - Sombra: shadow-[0_0_3px_rgba(0,0,0,0.1)] calibrada
                - Condición: Respeta transparentBackground toggle
                - Color: Dinámico según backgroundColor del formulario
                
                Esta capa proporciona el fondo dinámico redondeado sin afectar descargas
            */}
            {(displayState.showRealBarcode || displayState.showEmptyState) && !transparentBackground && (
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-lg shadow-[0_0_3px_rgba(0,0,0,0.1)]"
                style={{ backgroundColor: backgroundColor || '#FFFFFF' }}
              />
            )}
            
            {/* Glass frame effect for transparent background */}
            {(displayState.showRealBarcode || displayState.showEmptyState) && transparentBackground && (
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-lg pointer-events-none"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            )}
            
            {/* ⚠️ CONTENEDOR QR CRÍTICO - MANTENER ESTRUCTURA
                - Dimensiones: 320x320px exactos
                - overflow-hidden: REQUERIDO
                - z-10: NECESARIO para estar sobre el fondo
                - Eventos mouse: CONTROLAN overlay de descarga
            */}
            <div 
              className="relative w-[320px] h-[320px] flex items-center justify-center overflow-visible z-10 rounded-lg"
              onMouseEnter={() => {
                if (qrData && !isPlaceholderData(qrData) && displayState.showRealBarcode) {
                  setShowDownloadOverlay(true);
                }
              }}
              onMouseLeave={() => {
                setShowDownloadOverlay(false);
              }}
            >
              {/* Loading state */}
              {displayState.showLoadingState && (
                <div 
                  className="absolute inset-0 flex items-center justify-center z-20"
                  style={{ backgroundColor: transparentBackground ? 'transparent' : (backgroundColor || '#FFFFFF') }}
                >
                  <div className="flex flex-col items-center">
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
                    <p className="text-sm text-slate-600 font-medium mt-4">
                      Generando código...
                    </p>
                  </div>
                </div>
              )}

              {/* ⚠️ QR DISPLAY CRÍTICO - ALINEACIÓN PERFECTA
                  - pt-[6px]: CALIBRADO para centrado vertical perfecto
                  - absolute inset-0: REQUERIDO para posicionamiento
                  - flex center: MANTENER para alineación
                  
                  NO MODIFICAR el padding-top, fue ajustado píxel por píxel
              */}
              {displayState.showRealBarcode && (
                <div className="absolute inset-0 flex items-center justify-center pt-[6px]">
                  {qrDisplay}
                </div>
              )}

              {/* ⚠️ VIDEO PLACEHOLDER - DIMENSIONES SINCRONIZADAS
                  - Tamaño: 310x310px - MISMO que el QR
                  - rounded-lg: NECESARIO para que no se superpongan esquinas
                  - object-cover: MANTENER para proporción correcta
                  
                  Debe coincidir exactamente con el tamaño del QR
              */}
              {displayState.showEmptyState && (
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  loop
                  className="w-[310px] h-[310px] object-cover rounded-lg"
                  src="/assets/videos/qr-placeholder.mp4"
                />
              )}
              
              {/* ⚠️ OVERLAY DE DESCARGA - CONFIGURACIÓN PRECISA
                  Siguiendo los 5 pilares del IA_MANIFESTO:
                  - Pilar 1: Seguro por defecto - Control de estados
                  - Pilar 2: Robusto - Manejo de transiciones
                  - Pilar 3: Simple - Un solo overlay
                  - Pilar 4: Modular - Autocontenido
                  - Pilar 5: Valor para usuario - Acceso rápido
                  
                  DIMENSIONES CRÍTICAS:
                  - bottom-6: Posición desde la base calibrada
                  - w-[90%] h-[20%]: Proporciones exactas
                  - bg-white/80: Transparencia óptima
                  - rounded-2xl: Radio de bordes consistente
                  - z-40: Capa correcta sobre QR pero bajo badge
                  
                  NO MODIFICAR sin pruebas exhaustivas
              */}
              <div
                className={`
                  absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-[20%]
                  bg-white/80
                  backdrop-blur-md
                  rounded-2xl
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-300 ease-out
                  z-40
                  ${showDownloadOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                `}
              >
                <div className="flex flex-row gap-2 w-full px-3">
                  <Button
                    onClick={handleDownloadPNG}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 h-8 text-xs"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PNG
                  </Button>
                  <Button
                    onClick={handleDownloadSVG}
                    variant="outline"
                    className="flex-1 bg-white/80 hover:bg-white border-gray-300 text-gray-700 shadow-sm h-8 text-xs"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    SVG
                  </Button>
                </div>
              </div>
            </div>
            
            {/* 🎯 Elite Hero Implementation - Componente Unificado */}
            {/* ⚠️ IMPORTANTE: Esta funcionalidad está completamente implementada y probada.
                NO MODIFICAR este código a menos que sea explícitamente autorizado por el usuario.
                El componente HeroScannabilityDisplay incluye:
                - Auto-despliegue/replegado automático
                - Animación morphing badge → check
                - Análisis de escaneabilidad en tiempo real
                - Temporización precisa de 5 segundos
            */}
            {barcodeType === 'qrcode' && 
             scannabilityAnalysis && 
             qrData && 
             !isPlaceholderData(qrData) && 
             displayState.showRealBarcode && (
              <HeroScannabilityDisplay
                analysis={scannabilityAnalysis}
                isNewGeneration={isNewGeneration}
              />
            )}
          </div>
        </div>
      </div>
    </div>
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