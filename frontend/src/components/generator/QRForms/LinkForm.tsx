import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { qrPlaceholders } from '@/constants/qrPlaceholders';
import { cn } from '@/lib/utils';
import { Check, CircleX, RefreshCw, X } from 'lucide-react';

interface LinkFormProps {
  data: {
    url: string;
  };
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
  validationError?: string | null;
  urlValidation?: {
    isValidating: boolean;
    metadata: any;
    error: string | null;
  };
  onUrlValidationComplete?: (exists: boolean, error: string | null, url?: string) => void;
  urlExists?: boolean | null;
  onGenerateAnyway?: () => void;
  shouldShowGenerateAnywayButton?: boolean;
}

export const LinkForm: React.FC<LinkFormProps> = ({ 
  data, 
  onChange, 
  isLoading, 
  validationError,
  urlValidation,
  onUrlValidationComplete,
  urlExists,
  onGenerateAnyway,
  shouldShowGenerateAnywayButton
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(false);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasValue = data.url && data.url.length > 0;
  const hasRealValue = hasValue && data.url !== 'https://tu-sitio-web.com';
  const isValidUrl = hasRealValue && !validationError && data.url !== '';
  
  
  // Use URL validation from parent component
  const isValidating = urlValidation?.isValidating || false;
  const metadata = urlValidation?.metadata || null;
  const validationUrlError = urlValidation?.error || null;
  
  // Determinar si mostrar warning de sitio no disponible
  // Ahora también muestra el warning cuando está enfocado si ya se validó
  const showWarning = !isValidating && isValidUrl && metadata && !metadata.exists;
  
  // Determinar si es un mensaje de guía (azul) o un error real (rojo)
  const isGuidanceMessage = 
    validationError === 'Ingresa el enlace de tu sitio web o página' ||
    validationError === 'Continúa escribiendo...' ||
    validationError?.includes('Añade') ||
    validationError?.includes('Completa');
  
  // Note: URL validation is now handled by the parent component
  
  // Notificar cuando la validación se complete
  // CRITICAL: This coordination between LinkForm and page.tsx is essential
  // LinkForm validates URL existence, then notifies parent via callback
  // Parent then decides whether to generate QR or show warning
  const lastNotifiedUrl = useRef<string>('');
  useEffect(() => {
    if (onUrlValidationComplete && metadata && !isValidating) {
      // Solo notificar si es una URL diferente para evitar loops
      // Without this check, we'd notify repeatedly for the same URL
      const currentUrl = data.url;
      if (currentUrl !== lastNotifiedUrl.current) {
        lastNotifiedUrl.current = currentUrl;
        onUrlValidationComplete(metadata.exists, validationUrlError, currentUrl);
      }
    }
  }, [metadata, isValidating, validationUrlError, onUrlValidationComplete, data.url]);
  
  // Mostrar badge con delay apropiado según el estado
  useEffect(() => {
    // Limpiar timer anterior
    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
    }
    
    if (isValidUrl && isValidating) {
      // Mostrar badge inmediatamente cuando empieza a validar
      setShowBadge(true);
    } else if (isValidUrl && metadata && metadata.exists) {
      // Mantener badge visible si ya se validó exitosamente
      setShowBadge(true);
    } else if (!isValidUrl) {
      // Si la URL no es válida, ocultar badge
      setShowBadge(false);
    }
    
    // Cleanup
    return () => {
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
    };
  }, [isValidUrl, isValidating, metadata]);
  
  // Ocultar badge cuando se enfoca el input SOLO si el usuario empieza a escribir
  useEffect(() => {
    if (isFocused && showBadge) {
      // No ocultar automáticamente el badge al enfocar
      // Solo se ocultará si el usuario cambia la URL
    }
  }, [isFocused, showBadge]);
  
  // Handle click on the entire component area
  const handleContainerClick = () => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      // If valid URL, show badge immediately
      if (isValidUrl) {
        setShowBadge(true);
        // Blur the input to complete the action
        inputRef.current?.blur();
      }
    }
  };
  
  // Clear input on first click if it has default value
  const handleInputClick = () => {
    if (data.url === '' || data.url === 'https://tu-sitio-web.com') {
      onChange('url', '');
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Sitio Web</label>
      <div 
        className="relative cursor-text"
        onClick={handleContainerClick}
      >
        {/* Container with rounded corners and proper overflow handling */}
        <div className={cn(
          "relative rounded-lg",
          validationError && "rounded-b-none" // Remove bottom corners when error
        )}>
          {/* Border - now part of the input container */}
          <div className={cn(
            "absolute inset-0 border rounded-lg transition-all duration-200 pointer-events-none",
            isGuidanceMessage ? [
              "border-corporate-blue-400 dark:border-corporate-blue-400",
              "rounded-b-none border-b-0" // Remove bottom border and corners
            ] : validationError ? [
              "border-[#D52E4C] dark:border-[#D52E4C]",
              "rounded-b-none border-b-0" // Remove bottom border and corners
            ] : showWarning ? [
              "border-[#D52E4C] dark:border-[#D52E4C]",
              "rounded-b-none border-b-0" // Remove bottom border and corners for warning
            ] : [
              "border-slate-300 dark:border-slate-700"
              // Default border
            ]
          )} />
          
          {/* Input area - always visible */}
          <Input
            ref={inputRef}
            value={data.url}
            onChange={(e) => {
              onChange('url', e.target.value);
              // Ocultar badge cuando el usuario modifica la URL
              if (showBadge && e.target.value !== data.url) {
                setShowBadge(false);
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              // Clear on focus if empty or has default value
              if (data.url === '' || data.url === 'https://tu-sitio-web.com') {
                onChange('url', '');
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // Restore badge if URL is still valid and has metadata
              if (isValidUrl && metadata && metadata.exists) {
                setShowBadge(true);
              }
            }}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder="https://tu-sitio-web.com"
            className={cn(
              "h-10 w-full px-3 border-0 rounded-lg transition-all duration-200",
              "focus:outline-none focus:ring-0",
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent", // Remove all focus effects
              "placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "bg-white dark:bg-slate-950",
              // Text color based on state
              validationError ? "text-slate-900 dark:text-white" : isValidUrl ? "text-corporate-blue-700 dark:text-corporate-blue-300" : "text-slate-900 dark:text-white",
              // Hide text when showing badge
              showBadge && isValidUrl && "text-transparent"
            )}
            disabled={isLoading}
          />
          
          {/* Removed separate validation indicator - now shown inside badge */}
          
          {/* Badge overlay for valid URLs after 3 seconds or when not focused */}
          {showBadge && isValidUrl && (
            <div 
              className="absolute inset-0 flex items-center px-3"
            >
              <div className="relative">
                <a
                  href={data.url.startsWith('http') ? data.url : `https://${data.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-3 py-0.5 rounded-full bg-gradient-to-r from-corporate-blue-50 to-corporate-blue-100 text-corporate-blue-700 font-normal text-sm border border-corporate-blue-200 items-center gap-1.5 no-underline hover:from-corporate-blue-100 hover:to-corporate-blue-200 hover:border-corporate-blue-300 transition-all duration-200 cursor-pointer group relative"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering input focus
                  title={metadata?.title || 'Visitar sitio web'}
                >
                  {/* Flujo de validación: Spinner → Favicon → Checkmark */}
                  
                  {/* 1. Spinner mientras valida */}
                  {isValidating && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-corporate-blue-600" />
                  )}
                  
                  {/* 2. Favicon cuando se completa la validación */}
                  {!isValidating && metadata?.favicon && (
                    <img 
                      src={metadata.favicon} 
                      alt="" 
                      className="w-4 h-4 rounded-sm flex-shrink-0"
                      onError={(e) => {
                        // Si falla cargar el favicon, ocultarlo
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* URL siempre visible */}
                  {data.url}
                  
                  {/* 3. Indicadores finales: Check o Error */}
                  {!isValidating && metadata?.exists && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {!isValidating && validationUrlError && (
                    <CircleX className="h-3.5 w-3.5 text-[#D52E4C]" />
                  )}
                  
                  {/* Tooltip mejorado */}
                  {!isValidating && metadata?.exists && metadata.title && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                      {metadata.title}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 rounded-sm"></span>
                    </span>
                  )}
                </a>
                
                {/* Clear button - X floating on top right of badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('url', '');
                    setShowBadge(false);
                    // Focus the input for immediate typing
                    inputRef.current?.focus();
                  }}
                  className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm"
                  title="Limpiar"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Error or initial message - appears as extension below input */}
        {validationError && (
          <div 
            className={cn(
              "border border-t-0 rounded-b-lg px-3 py-1.5",
              "text-xs font-medium",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              "cursor-text",
              isGuidanceMessage ? "text-corporate-blue-700 dark:text-corporate-blue-700" : "text-white",
              isGuidanceMessage ? [
                "border-corporate-blue-400 dark:border-corporate-blue-400",
                "bg-gradient-to-br from-corporate-blue-50 to-corporate-blue-100/50"
              ] : [
                "border-[#D52E4C] dark:border-[#D52E4C]",
                "bg-[#D52E4C] dark:bg-[#D52E4C]"
              ]
            )}
            onClick={(e) => {
              e.stopPropagation(); // Prevent double-click handling
              handleContainerClick();
            }}
          >
            {validationError}
          </div>
        )}
        
        {/* Warning message - site not available */}
        {showWarning && (
          <div 
            className={cn(
              "border border-[#D52E4C] dark:border-[#D52E4C]",
              "border-t-0 rounded-b-lg", // Connect to input with bottom corners
              "px-3 py-1.5",
              "bg-[#D52E4C] dark:bg-[#D52E4C]",
              "text-white text-xs font-medium",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              "cursor-text",
              "flex items-center justify-between gap-1.5"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleContainerClick();
            }}
          >
            <div className="flex items-center gap-1.5">
              <CircleX className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Verifica que el sitio web esté disponible</span>
            </div>
            {shouldShowGenerateAnywayButton && onGenerateAnyway && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateAnyway();
                }}
                className="px-2 py-0.5 text-xs font-medium text-[#D52E4C] bg-white hover:bg-gray-100 rounded transition-colors duration-200"
              >
                Generar de todas formas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};