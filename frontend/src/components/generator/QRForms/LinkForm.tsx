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
}

export const LinkForm: React.FC<LinkFormProps> = ({ data, onChange, isLoading, validationError, urlValidation }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(false);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasValue = data.url && data.url.length > 0;
  const isValidUrl = hasValue && !validationError && data.url !== '' && data.url !== 'https://tu-sitio-web.com';
  
  // Use URL validation from parent component
  const isValidating = urlValidation?.isValidating || false;
  const metadata = urlValidation?.metadata || null;
  const validationUrlError = urlValidation?.error || null;
  
  // Determinar si mostrar warning de sitio no disponible
  // Ahora también muestra el warning cuando está enfocado si ya se validó
  const showWarning = !isValidating && isValidUrl && metadata && !metadata.exists;
  
  // Determinar si es el mensaje inicial (azul) o un error real (rojo)
  const isInitialMessage = validationError === 'Ingresa el enlace de tu sitio web o página' && !hasValue;
  
  // Note: URL validation is now handled by the parent component
  
  // Auto-mostrar badge después de 3 segundos si la URL es válida
  useEffect(() => {
    // Limpiar timer anterior
    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
    }
    
    if (isValidUrl) {
      // Iniciar timer de 3 segundos
      badgeTimerRef.current = setTimeout(() => {
        setShowBadge(true);
      }, 3000);
    } else {
      // Si la URL no es válida, ocultar badge inmediatamente
      setShowBadge(false);
    }
    
    // Cleanup
    return () => {
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
    };
  }, [isValidUrl]);
  
  // Ocultar badge cuando se enfoca el input (excepto si se acaba de presionar Enter)
  useEffect(() => {
    if (isFocused) {
      // Solo ocultar si no fue activado manualmente por Enter
      const timer = setTimeout(() => {
        if (isFocused) {
          setShowBadge(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);
  
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
    <div className="mt-5"> {/* Extra spacing for floating label */}
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
            isInitialMessage ? [
              "border-corporate-blue-400 dark:border-corporate-blue-400",
              "rounded-b-none border-b-0" // Remove bottom border and corners
            ] : validationError ? [
              "border-[#D52E4C] dark:border-[#D52E4C]",
              "rounded-b-none border-b-0" // Remove bottom border and corners
            ] : showWarning ? [
              "border-[#E0541C] dark:border-[#E0541C]",
              "rounded-b-none border-b-0" // Remove bottom border and corners for warning
            ] : [
              "border-slate-300 dark:border-slate-700"
              // Default border
            ]
          )} />
          
          {/* Floating label - Material Design style */}
          <label
            className={cn(
              "absolute left-2.5 transition-all duration-200 pointer-events-none z-10",
              isInitialMessage ? "text-corporate-blue-700 dark:text-corporate-blue-700" : validationError ? "text-[#D52E4C]" : showWarning ? "text-[#E0541C]" : "text-slate-500 dark:text-slate-400",
              (isFocused || hasValue) ? [
                "-top-2.5 text-xs px-2", // Floating position with more padding
                "bg-gradient-to-b from-white to-white dark:from-slate-950 dark:to-slate-950", // Solid background to cover border
                !validationError && !showWarning && "text-slate-600 dark:text-slate-300" // Only apply gray when no error or warning
              ] : [
                "top-1/2 -translate-y-1/2 text-base" // Perfectly centered when inside
              ]
            )}
          >
            Sitio Web
          </label>
          
          {/* Input area - always visible */}
          <Input
            ref={inputRef}
            value={data.url}
            onChange={(e) => onChange('url', e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              // Clear on focus if empty or has default value
              if (data.url === '' || data.url === 'https://tu-sitio-web.com') {
                onChange('url', '');
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // Restore badge if URL is still valid
              if (isValidUrl) {
                setShowBadge(true);
              }
            }}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-12 w-full px-3 border-0 rounded-lg transition-all duration-200",
              "focus:outline-none focus:ring-0",
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent", // Remove all focus effects
              "placeholder-transparent", // Hide placeholder when using floating label
              "bg-white dark:bg-slate-950",
              // Text color based on state
              validationError ? "text-slate-900 dark:text-white" : isValidUrl ? "text-corporate-blue-700 dark:text-corporate-blue-300" : "text-slate-900 dark:text-white",
              // Hide text when showing badge
              isValidUrl && !isFocused && "text-transparent"
            )}
            disabled={isLoading}
          />
          
          {/* Validation indicator - shows while validating */}
          {isValidating && isValidUrl && !showBadge && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-500" />
            </div>
          )}
          
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
                  {data.url}
                  {/* Indicador de estado de validación */}
                  {isValidating && (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-corporate-blue-600" />
                  )}
                  {!isValidating && metadata?.exists && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  {!isValidating && validationUrlError && (
                    <CircleX className="h-3.5 w-3.5 text-[#E0541C]" />
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
              isInitialMessage ? "text-corporate-blue-700 dark:text-corporate-blue-700" : "text-white",
              isInitialMessage ? [
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
              "border border-[#E0541C] dark:border-[#E0541C]",
              "border-t-0 rounded-b-lg", // Connect to input with bottom corners
              "px-3 py-1.5",
              "bg-[#E0541C] dark:bg-[#E0541C]",
              "text-white text-xs font-medium",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              "cursor-text",
              "flex items-center gap-1.5"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleContainerClick();
            }}
          >
            <CircleX className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Verifica que el sitio web esté disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};