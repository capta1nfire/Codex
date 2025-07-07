import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, CircleX, RefreshCw, X } from 'lucide-react';
import { useEditingIntent } from '@/hooks/useEditingIntent';

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
  onEditingIntentChange?: (isEditing: boolean) => void;
}

export const LinkForm: React.FC<LinkFormProps> = ({ 
  data, 
  onChange, 
  isLoading, 
  validationError,
  urlValidation,
  onUrlValidationComplete,
  onGenerateAnyway,
  shouldShowGenerateAnywayButton,
  onEditingIntentChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const [showBadge, setShowBadge] = React.useState(false);
  const [maxUrlWidth, setMaxUrlWidth] = React.useState<number>(200);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const previousValueRef = useRef<string>(data.url);
  const pendingValueRef = useRef<string | null>(null);
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para mostrar mensaje de validación lenta
  const [showSlowValidationMessage, setShowSlowValidationMessage] = React.useState(false);
  const slowValidationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local state for input display value (separate from data.url)
  const [displayValue, setDisplayValue] = React.useState(data.url);
  
  const hasValue = displayValue && displayValue.length > 0;
  const hasRealValue = hasValue && displayValue !== 'https://tu-sitio-web.com';
  
  /**
   * 🛡️ Normalización de URL para QR Code siguiendo mejores prácticas ISO/IEC 18004
   * 
   * IMPORTANTE: Siempre incluir protocolo completo para máxima compatibilidad
   * 
   * Mejores prácticas basadas en investigación:
   * - ✅ SIEMPRE incluir protocolo (http:// o https://)
   * - ✅ Usar minúsculas para el protocolo
   * - ✅ HTTPS por defecto (seguro por defecto)
   * 
   * Razones:
   * 1. Compatibilidad universal con todos los lectores QR
   * 2. iOS/Android tienen problemas sin protocolo
   * 3. Evita interpretación como texto plano
   * 4. Seguridad: dispositivo sabe usar HTTPS
   * 
   * Trade-off aceptado:
   * - "apple.com" → 9 caracteres → ~21 módulos QR
   * - "https://apple.com" → 17 caracteres → ~29 módulos QR
   * - 8 módulos extra valen la pena por compatibilidad garantizada
   * 
   * @param url - URL ingresada por el usuario
   * @returns URL normalizada con protocolo
   */
  const normalizeUrlForQR = (url: string): string => {
    if (!url || url.trim() === '') {
      return '';
    }
    
    const trimmedUrl = url.trim();
    
    // Si ya tiene protocolo, devolverlo tal cual
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // 🛡️ Pilar 1: Seguro por defecto - Agregar https:// 
    return `https://${trimmedUrl}`;
  };

  // Basic URL format validation during editing
  const isBasicValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '' || url === 'https://tu-sitio-web.com') {
      return false;
    }
    
    const trimmedUrl = url.trim();
    
    // Check for basic URL pattern (with or without protocol)
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;
    const hasProtocol = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
    
    if (hasProtocol) {
      return urlPattern.test(trimmedUrl);
    } else {
      // For URLs without protocol, require at least one dot and basic domain structure
      return /^[\w-]+\.[\w-]+(\.[\w-]+)*(\/.*)?$/i.test(trimmedUrl);
    }
  };
  
  const isValidUrl = hasRealValue && !validationError && displayValue !== '' && isBasicValidUrl(displayValue);
  
  // Sync displayValue when data.url changes from external source
  React.useEffect(() => {
    // Only update if it's different and we're not currently editing
    if (data.url !== displayValue && !editingIntent.isInEditingMode()) {
      setDisplayValue(data.url);
      previousValueRef.current = data.url;
    }
  }, [data.url, displayValue]);

  // Only show badge for user-entered URLs, not defaults
  const isUserEnteredUrl = hasRealValue && 
    displayValue !== 'https://codex.app' && 
    displayValue !== 'https://tu-sitio-web.com' &&
    displayValue !== '';
  
  // Use editing intent detection
  const editingIntent = useEditingIntent({
    onIntentChange: (isEditing: boolean) => {
      console.log('[LinkForm] Editing intent changed:', { isEditing, pendingValue: pendingValueRef.current });
      
      // Notify parent
      onEditingIntentChange?.(isEditing);
      
      // If user stopped editing and we have a pending value, trigger onChange
      if (!isEditing && pendingValueRef.current !== null) {
        console.log('[LinkForm] User finished editing, triggering onChange with:', pendingValueRef.current);
        
        // Clear existing timeout
        if (editingTimeoutRef.current) {
          clearTimeout(editingTimeoutRef.current);
        }
        
        // Set a small delay to ensure editing state is stable
        editingTimeoutRef.current = setTimeout(() => {
          if (pendingValueRef.current !== null) {
            // Only send valid URLs or empty values
            const isValidFormat = isBasicValidUrl(pendingValueRef.current) || pendingValueRef.current.trim() === '';
            console.log('[LinkForm] Checking pending value format:', pendingValueRef.current, 'isValid:', isValidFormat);
            
            if (isValidFormat) {
              // 🛡️ Normalizar URL antes de enviar (solo si no es vacía)
              const normalizedUrl = pendingValueRef.current.trim() === '' ? '' : normalizeUrlForQR(pendingValueRef.current);
              onChange('url', normalizedUrl);
              pendingValueRef.current = null;
            } else {
              console.log('[LinkForm] SKIPPING onChange for invalid pending URL:', pendingValueRef.current);
              // Keep the value as pending, don't clear it yet
            }
          }
        }, 100);
      }
    }
  });
  
  // Debug log on mount and set mounted flag
  useEffect(() => {
    console.log('[LinkForm Mount] Initial state:', {
      url: data.url,
      hasUserInteracted,
      isUserEnteredUrl,
      isValidUrl,
      urlValidation,
      metadata: urlValidation?.metadata
    });
    // Set mounted after a small delay to prevent initial badge
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);
  
  // Format URL for display - prioritize showing end
  const formatUrlForDisplay = (url: string): string => {
    // Remove protocol if present to save space
    const withoutProtocol = url.replace(/^https?:\/\//, '');
    // Remove www. if present to save more space
    const cleanUrl = withoutProtocol.replace(/^www\./, '');
    return cleanUrl;
  };
  
  
  // Use URL validation from parent component
  const isValidating = urlValidation?.isValidating || false;
  const metadata = urlValidation?.metadata || null;
  const validationUrlError = urlValidation?.error || null;
  
  // ⚠️ TIMER DE VALIDACIÓN LENTA - CONFIGURACIÓN CRÍTICA
  // Este efecto detecta cuando la validación tarda más de 2 segundos
  // Casos de uso: tesla.com, sitios lentos, CDNs con alta latencia
  // 
  // TIMING CRÍTICO:
  // - 2000ms (2 segundos) es el punto óptimo calibrado
  // - Menos tiempo: Mensaje aparece muy rápido (molesto)
  // - Más tiempo: Usuario piensa que se congeló
  //
  // NO MODIFICAR el timeout sin pruebas exhaustivas con sitios lentos
  React.useEffect(() => {
    // Limpiar timer anterior
    if (slowValidationTimerRef.current) {
      clearTimeout(slowValidationTimerRef.current);
      slowValidationTimerRef.current = null;
    }
    
    if (isValidating) {
      // ⚠️ TIMER DE 2 SEGUNDOS - NO CAMBIAR
      slowValidationTimerRef.current = setTimeout(() => {
        setShowSlowValidationMessage(true);
      }, 2000); // 2000ms calibrado para UX óptima
    } else {
      // Si no está validando, ocultar mensaje inmediatamente
      setShowSlowValidationMessage(false);
    }
    
    // Cleanup
    return () => {
      if (slowValidationTimerRef.current) {
        clearTimeout(slowValidationTimerRef.current);
      }
    };
  }, [isValidating]);
  
  // Debug logging for metadata
  React.useEffect(() => {
    if (metadata) {
      console.log('[LinkForm] Metadata received:', {
        exists: metadata.exists,
        favicon: metadata.favicon,
        title: metadata.title,
        url: displayValue
      });
    }
  }, [metadata, displayValue]);
  
  // Determinar si mostrar warning de sitio no disponible
  // Ahora también muestra el warning cuando está enfocado si ya se validó
  const showWarning = !isValidating && isValidUrl && metadata && !metadata.exists;
  
  // Determinar si es un mensaje de guía (azul) o un error real (rojo)
  const isGuidanceMessage = 
    validationError === 'Ingresa o pega el enlace de tu sitio web' ||
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
    console.log('[LinkForm Badge Logic] Effect triggered:', {
      hasUserInteracted,
      isUserEnteredUrl,
      isValidUrl,
      isValidating,
      hasMetadata: !!metadata,
      metadataExists: metadata?.exists,
      currentUrl: data.url,
      showBadge
    });
    
    // Limpiar timer anterior
    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
    }
    
    // Only show badge for user-entered URLs, not defaults, and only after user interaction AND component is mounted
    if (isMounted && hasUserInteracted && isUserEnteredUrl && isValidUrl && isValidating) {
      console.log('[LinkForm Badge Logic] Setting badge TRUE - validating');
      // Mostrar badge inmediatamente cuando empieza a validar
      setShowBadge(true);
    } else if (isMounted && hasUserInteracted && isUserEnteredUrl && isValidUrl && metadata && metadata.exists) {
      console.log('[LinkForm Badge Logic] Setting badge TRUE - validation complete');
      // Mantener badge visible si ya se validó exitosamente
      setShowBadge(true);
    } else {
      console.log('[LinkForm Badge Logic] Setting badge FALSE - conditions not met:', {
        isMounted,
        hasUserInteracted,
        isUserEnteredUrl,
        isValidUrl
      });
      // Si no cumple TODAS las condiciones, ocultar badge
      setShowBadge(false);
    }
    
    // Cleanup
    return () => {
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
    };
  }, [isValidUrl, isValidating, metadata, isUserEnteredUrl, hasUserInteracted, isMounted]);
  
  // Ocultar badge cuando se enfoca el input SOLO si el usuario empieza a escribir
  useEffect(() => {
    if (isFocused && showBadge) {
      // No ocultar automáticamente el badge al enfocar
      // Solo se ocultará si el usuario cambia la URL
    }
  }, [isFocused, showBadge]);
  
  // Calculate max width for URL based on container width
  useEffect(() => {
    if (!showBadge) return;
    
    const calculateMaxWidth = () => {
      if (containerRef.current && inputRef.current) {
        // Get the actual container width (the div that holds the input)
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        
        // Calculate space needed for other elements:
        // - Badge left padding: 12px (px-3)
        // - Badge right padding: 12px (px-3)  
        // - Favicon + gap: 22px (16px + 6px)
        // - Check icon + gap: 22px (16px + 6px)
        // - X button (absolute): doesn't take space in flow
        // - Safety margin: 20px
        const reservedSpace = 88;
        
        const availableWidth = containerWidth - reservedSpace;
        const finalWidth = Math.floor(availableWidth * 0.99); // Use 99% to maximize space usage
        
        setMaxUrlWidth(Math.max(80, finalWidth));
      }
    };
    
    // Use ResizeObserver for more accurate detection
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(calculateMaxWidth);
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial calculation
    setTimeout(calculateMaxWidth, 150);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [showBadge]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
      }
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
      if (slowValidationTimerRef.current) {
        clearTimeout(slowValidationTimerRef.current);
      }
    };
  }, []);
  
  // Handle click on the entire component area
  const handleContainerClick = () => {
    // Don't interfere if user is selecting text
    if (editingIntent.isInEditingMode()) {
      return;
    }
    
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
      // Only set cursor at end if no selection exists
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        setTimeout(() => {
          if (inputRef.current) {
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
          }
        }, 0);
      }
    }
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      // If valid URL and user-entered AND user has interacted, show badge immediately
      if (hasUserInteracted && isUserEnteredUrl && isValidUrl) {
        setShowBadge(true);
        // Blur the input to complete the action
        inputRef.current?.blur();
      }
    }
  };
  
  // Clear input on first click if it has default value
  const handleInputClick = () => {
    if (displayValue === '' || displayValue === 'https://tu-sitio-web.com') {
      setDisplayValue('');
      onChange('url', '');
    }
  };

  return (
    <div style={{ overflow: 'visible' }}>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Sitio Web</label>
      <div 
        className="relative cursor-text"
        onClick={handleContainerClick}
        style={{ overflow: 'visible' }}
      >
        {/* Container with rounded corners and proper overflow handling */}
        <div 
          ref={containerRef}
          className={cn(
            "relative rounded-lg",
            validationError && "rounded-b-none" // Remove bottom corners when error
          )}
        >
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
            value={displayValue}
            onChange={(e) => {
              const newValue = e.target.value;
              const oldValue = previousValueRef.current;
              
              console.log('[LinkForm] onChange triggered:', {
                inputValue: newValue,
                currentDataUrl: data.url,
                displayValue,
                showBadge,
                isFocused,
                isEditing: editingIntent.isInEditingMode()
              });
              
              // ALWAYS update display value immediately for visual feedback
              setDisplayValue(newValue);
              
              // Track value changes for intent detection
              editingIntent.handleChange(newValue, oldValue);
              previousValueRef.current = newValue;
              
              // Mark that user has interacted
              if (!hasUserInteracted) {
                setHasUserInteracted(true);
              }
              
              // Hide badge immediately when user starts typing
              if (showBadge) {
                console.log('[LinkForm] Hiding badge due to typing');
                setShowBadge(false);
              }
              
              // Only trigger parent onChange if user is not in editing mode
              const isCurrentlyEditing = editingIntent.isInEditingMode();
              console.log('[LinkForm] Editing state check:', {
                newValue,
                isCurrentlyEditing,
                willTriggerOnChange: !isCurrentlyEditing,
                editingState: {
                  isSelecting: editingIntent.handlers.onSelect,
                  consecutiveDeletes: 'hidden', // Internal state
                  smartDebounceTime: editingIntent.getSmartDebounceTime()
                }
              });
              
              if (!isCurrentlyEditing) {
                // Only trigger onChange if the URL has valid basic format or is empty
                const isValidFormat = isBasicValidUrl(newValue) || newValue.trim() === '';
                console.log('[LinkForm] Calling onChange with:', newValue, 'isValidFormat:', isValidFormat);
                
                if (isValidFormat) {
                  // 🛡️ Normalizar URL antes de enviar (solo si no es vacía)
                  const normalizedUrl = newValue.trim() === '' ? '' : normalizeUrlForQR(newValue);
                  onChange('url', normalizedUrl);
                  pendingValueRef.current = null; // Clear pending since we triggered
                } else {
                  console.log('[LinkForm] SKIPPING onChange - invalid URL format:', newValue);
                  pendingValueRef.current = newValue; // Store for later when valid
                }
              } else {
                console.log('[LinkForm] SKIPPING onChange - user is editing, storing as pending');
                pendingValueRef.current = newValue; // Store for later
              }
              
              // Reset editing state after change  
              setTimeout(() => {
                editingIntent.resetEditingState();
              }, 50); // Reduced from 100ms to 50ms for faster response
            }}
            onFocus={() => {
              setIsFocused(true);
              // Mark user interaction on focus
              if (!hasUserInteracted) {
                setHasUserInteracted(true);
              }
              // Only clear if showing default placeholder value
              if (displayValue === 'https://tu-sitio-web.com') {
                setDisplayValue('');
                onChange('url', '');
              }
              // Hide badge when focusing to allow editing, but DON'T clear the URL
              if (showBadge) {
                setShowBadge(false);
                // Reset validation tracking to allow re-validation
                lastNotifiedUrl.current = '';
                // DON'T clear the URL - let user edit it
              }
            }}
            onBlur={() => {
              setIsFocused(false);
              // Restore badge if URL is still valid and has metadata AND is user-entered AND user has interacted
              if (hasUserInteracted && isUserEnteredUrl && isValidUrl && metadata && metadata.exists) {
                setShowBadge(true);
              }
            }}
            onClick={handleInputClick}
            onKeyDown={(e) => {
              editingIntent.handlers.onKeyDown(e);
              handleKeyDown(e);
            }}
            onSelect={editingIntent.handlers.onSelect}
            onMouseDown={editingIntent.handlers.onMouseDown}
            placeholder="https://tu-sitio-web.com"
            className={cn(
              "h-10 w-full px-3 border-0 rounded-lg transition-all duration-200",
              "focus:outline-none focus:ring-0",
              "focus-visible:outline-none focus-visible:ring-0 focus-visible:border-transparent", // Remove all focus effects
              "placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "bg-white dark:bg-slate-950",
              // Text color based on state
              validationError ? "text-slate-900 dark:text-white" : isValidUrl ? "text-corporate-blue-700 dark:text-corporate-blue-300" : "text-slate-900 dark:text-white",
              // Hide text when showing badge but keep cursor visible
              showBadge && isValidUrl && "text-transparent caret-slate-900 dark:caret-white"
            )}
            disabled={isLoading}
          />
          
          {/* Removed separate validation indicator - now shown inside badge */}
          
          {/* Badge overlay for valid URLs after 3 seconds or when not focused */}
          {showBadge && isValidUrl && (
            <div 
              className="absolute inset-0 flex items-center px-3"
              onClick={(e) => {
                // Si el click no fue en el link del badge, volver al modo edición
                const target = e.target as HTMLElement;
                if (!target.closest('a')) {
                  e.stopPropagation();
                  setShowBadge(false);
                  // Reset validation tracking when user wants to edit
                  lastNotifiedUrl.current = '';
                  // DON'T clear the URL - let user edit it
                  // Focus the input for immediate typing
                  inputRef.current?.focus();
                }
              }}
              style={{ cursor: 'text' }}
            >
              <div className="relative flex items-center max-w-full">
                
                <a
                  href={normalizeUrlForQR(data.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-3 py-0.5 rounded-full bg-gradient-to-r from-corporate-blue-50 to-corporate-blue-100 text-corporate-blue-700 font-normal text-sm border border-corporate-blue-200 items-center gap-1.5 no-underline hover:from-corporate-blue-100 hover:to-corporate-blue-200 hover:border-corporate-blue-300 transition-all duration-200 cursor-pointer badge-link relative max-w-full"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering input focus
                  title={metadata?.title || ''}
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
                      onLoad={(e) => {
                        console.log('[Favicon] Successfully loaded:', metadata.favicon);
                      }}
                      onError={(e) => {
                        console.log('[Favicon] Failed to load:', metadata.favicon);
                        // Si falla cargar el favicon, ocultarlo
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* Fallback: mostrar icono genérico si no hay favicon */}
                  {!isValidating && !metadata?.favicon && metadata?.exists && (
                    <div className="w-4 h-4 rounded-sm flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-600">
                      <svg className="w-2.5 h-2.5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                  )}
                  
                  {/* URL con truncamiento normal */}
                  <span 
                    className="truncate"
                    style={{ maxWidth: `${maxUrlWidth}px` }}
                  >
                    {formatUrlForDisplay(displayValue)}
                  </span>
                  
                  {/* 3. Indicadores finales: Check o Error */}
                  {!isValidating && metadata?.exists && (
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  {!isValidating && validationUrlError && (
                    <CircleX className="h-3.5 w-3.5 text-[#D52E4C] flex-shrink-0" />
                  )}
                </a>
                
                {/* Clear button - X floating on top right of badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('url', '');
                    setShowBadge(false);
                    // Reset validation tracking
                    lastNotifiedUrl.current = '';
                    // Focus the input for immediate typing
                    inputRef.current?.focus();
                  }}
                  className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm z-[100]"
                  title="Limpiar"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* ⚠️ SISTEMA DE MENSAJES CRÍTICO - NO MODIFICAR SIN AUTORIZACIÓN
            Este bloque maneja TODOS los mensajes de feedback del input de URL.
            Fue calibrado para manejar múltiples estados con prioridades específicas.
            
            JERARQUÍA DE MENSAJES (en orden de prioridad):
            1. Validación lenta (>2s) - SIEMPRE tiene prioridad máxima
            2. Mensajes de guía - "Añade .com", "Completa el dominio", etc.
            3. Errores de validación - URLs inválidas o no encontradas
            
            CONDICIONES CRÍTICAS:
            - showSlowValidationMessage: Se activa después de 2 segundos exactos
            - isGuidanceMessage: Detecta mensajes informativos vs errores
            - validationError: Contiene mensajes de SmartValidators
            
            ESTILOS PROTEGIDOS:
            - Azul corporativo: Mensajes informativos y validación lenta
            - Rojo (#D52E4C): Solo para errores reales
            - Animación slide-in: Transición suave entre mensajes
            
            ⚠️ CAMBIAR ESTAS CONDICIONES ROMPERÁ:
            - Mensajes de ayuda como "Añade .com"
            - Feedback de validación lenta para sitios como tesla.com
            - Distinción visual entre guías y errores
        */}
        {(isValidating && showSlowValidationMessage) || validationError ? (
          <div 
            className={cn(
              "border border-t-0 rounded-b-lg px-3 py-1.5",
              "text-xs font-medium",
              "animate-in slide-in-from-top-1 fade-in duration-200",
              "cursor-text",
              // ⚠️ LÓGICA DE COLORES CRÍTICA
              // Si está validando lentamente, siempre usar estilo azul informativo
              (isValidating && showSlowValidationMessage) || isGuidanceMessage 
                ? "text-corporate-blue-700 dark:text-corporate-blue-700" 
                : "text-white",
              (isValidating && showSlowValidationMessage) || isGuidanceMessage ? [
                "border-corporate-blue-400 dark:border-corporate-blue-400",
                "bg-gradient-to-br from-corporate-blue-50 to-corporate-blue-100/50"
              ] : [
                "border-[#D52E4C] dark:border-[#D52E4C]",
                "bg-[#D52E4C] dark:bg-[#D52E4C]"
              ]
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleContainerClick();
            }}
          >
            {/* ⚠️ PRIORIDAD DE MENSAJES - ORDEN CRÍTICO */}
            {isValidating && showSlowValidationMessage 
              ? "Estamos validando el sitio web, esto podría tomar algunos segundos..."
              : validationError
            }
          </div>
        ) : null}
        
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
              <span>URL no encontrada. Por favor, verifique la dirección.</span>
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