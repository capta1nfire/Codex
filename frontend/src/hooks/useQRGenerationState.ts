import { useState, useCallback, useRef, useEffect } from 'react';
import { useQRGenerationV3Enhanced } from './useQRGenerationV3Enhanced';
import { useBarcodeGenerationV2 } from './useBarcodeGenerationV2';
import { GenerateFormData } from '@/schemas/generate.schema';
import { qrDefaultValues } from '@/constants/qrDefaultValues';

/**
 * Centralized QR Generation State Hook
 * Manages all QR generation states in a single place to prevent conflicts
 * Uses a state machine pattern to ensure predictable transitions
 */

type GenerationState = 
  | 'IDLE'
  | 'TYPING'
  | 'VALIDATING' 
  | 'READY_TO_GENERATE'
  | 'GENERATING'
  | 'COMPLETE'
  | 'ERROR';

interface GenerationStateData {
  state: GenerationState;
  data: string;
  isSmartQR: boolean;
  hasEnhancedData: boolean;
  error: string | null;
}

export const useQRGenerationState = () => {
  const [stateData, setStateData] = useState<GenerationStateData>({
    state: 'IDLE',
    data: '',
    isSmartQR: false,
    hasEnhancedData: false,
    error: null
  });

  // Refs to prevent stale closures
  const stateRef = useRef(stateData);
  const generationAbortController = useRef<AbortController | null>(null);

  // Update ref when state changes
  useEffect(() => {
    stateRef.current = stateData;
  }, [stateData]);

  // Generation hooks
  const v3Enhanced = useQRGenerationV3Enhanced();
  const v2Barcode = useBarcodeGenerationV2();

  // State transition function with validation
  const transitionTo = useCallback((newState: GenerationState, updates?: Partial<GenerationStateData>) => {
    setStateData(prev => {
      // Validate state transitions - FLUJO ORIGINAL MÁS PERMISIVO
      const validTransitions: Record<GenerationState, GenerationState[]> = {
        'IDLE': ['TYPING', 'GENERATING', 'VALIDATING', 'IDLE'], // Allow IDLE->IDLE for reset
        'TYPING': ['IDLE', 'VALIDATING', 'TYPING', 'GENERATING'], // Allow direct generation from typing
        'VALIDATING': ['READY_TO_GENERATE', 'ERROR', 'IDLE', 'VALIDATING', 'TYPING', 'GENERATING', 'COMPLETE'], // ✅ ALLOW DIRECT TRANSITIONS
        'READY_TO_GENERATE': ['GENERATING', 'IDLE', 'TYPING'],
        'GENERATING': ['COMPLETE', 'ERROR', 'IDLE'], // Allow cancel to IDLE
        'COMPLETE': ['IDLE', 'TYPING', 'GENERATING', 'VALIDATING'], // Allow immediate re-generation
        'ERROR': ['IDLE', 'TYPING', 'GENERATING', 'VALIDATING'] // Allow retry from error
      };

      const currentState = prev.state;
      const allowedTransitions = validTransitions[currentState];

      // Allow same state transitions (for updates), but not for GENERATING
      if (currentState === newState) {
        if (currentState === 'GENERATING') {
          // Don't allow GENERATING -> GENERATING
          console.warn(`Prevented duplicate generation: ${currentState} -> ${newState}`);
          return prev;
        }
        // Allow other same-state transitions for updates
        return {
          ...prev,
          ...updates,
          state: newState
        };
      }

      if (!allowedTransitions.includes(newState)) {
        console.warn(`Invalid state transition: ${currentState} -> ${newState}`);
        return prev;
      }

      return {
        ...prev,
        ...updates,
        state: newState
      };
    });
  }, []);

  // Handle typing state
  const setTyping = useCallback((data: string) => {
    // Abort any ongoing generation
    if (generationAbortController.current) {
      generationAbortController.current.abort();
      generationAbortController.current = null;
    }

    transitionTo('TYPING', { data, hasEnhancedData: false });
  }, [transitionTo]);

  // Handle validation state
  const setValidating = useCallback(() => {
    console.log('[useQRGenerationState] 🔄 TRANSITIONING TO VALIDATING');
    transitionTo('VALIDATING');
  }, [transitionTo]);

  // Handle ready to generate state
  const setReadyToGenerate = useCallback(() => {
    console.log('[useQRGenerationState] 🚀 TRANSITIONING TO READY_TO_GENERATE');
    transitionTo('READY_TO_GENERATE');
  }, [transitionTo]);

  // ⚠️ FUNCIÓN CRÍTICA - CARGA DE LOGOS PARA SMART QR
  // Esta función maneja la carga de logos tanto SVG como PNG/JPG
  // Es crucial para el funcionamiento correcto de Smart QR
  //
  // FORMATOS SOPORTADOS:
  // - SVG: Se procesa el texto y se hacen únicos los IDs de gradientes
  // - PNG/JPG/WEBP: Se convierte a Base64 directamente
  //
  // NO MODIFICAR sin probar con todos los tipos de logos
  const loadSvgAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }
      
      // Check if it's an SVG by content type or URL
      const contentType = response.headers.get('content-type') || '';
      const isSvg = contentType.includes('svg') || url.toLowerCase().endsWith('.svg');
      
      if (isSvg) {
        // Handle SVG files
        let svgText = await response.text();
        
        // Make gradient IDs unique to avoid conflicts
        const uniqueId = Math.random().toString(36).substr(2, 9);
        svgText = svgText.replace(/id="([^"]*)"/g, `id="$1-${uniqueId}"`);
        svgText = svgText.replace(/url\(#([^)]*)\)/g, `url(#$1-${uniqueId})`);
        
        // Convert SVG text to Base64
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        return `data:image/svg+xml;base64,${base64}`;
      } else {
        // Handle binary images (PNG, JPG, etc)
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image to base64'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  };

  // UX Enhancement: Minimum loading time for visual feedback
  const MINIMUM_LOADING_TIME_MS = 800; // Adjusted to 800ms for optimal UX timing

  /**
   * Ensures minimum loading time for better UX
   * If generation is too fast, adds delay to make loading animation visible
   * Only applies to user-initiated QR generation, not initial/placeholder generation
   */
  const ensureMinimumLoadingTime = async (startTime: number, signal: AbortController['signal'], data: string) => {
    // UNIVERSAL placeholder detection for ALL barcode types - should NOT get minimum loading time
    const isPlaceholderData = (inputData: string): boolean => {
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
        inputData.toLowerCase().includes(placeholder.toLowerCase())
      );
    };

    // Only apply minimum loading time for actual user data, not placeholders
    if (isPlaceholderData(data)) {
      console.log(`[UX Enhancement] Skipping minimum loading time for placeholder data: ${data.substring(0, 30)}...`);
      return;
    }

    const elapsedTime = Date.now() - startTime;
    const remainingTime = MINIMUM_LOADING_TIME_MS - elapsedTime;
    
    if (remainingTime > 0 && !signal.aborted) {
      console.log(`[UX Enhancement] Adding ${remainingTime}ms delay (800ms total) for optimal UX: ${data.substring(0, 30)}...`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
  };

  // Main generation function
  const generateQR = useCallback(async (
    formData: GenerateFormData,
    options?: {
      isSmartQR?: boolean;
      smartQRConfig?: any;
    }
  ) => {
    // Prevent concurrent generations
    if (stateRef.current.state === 'GENERATING') {
      console.log('[useQRGenerationState] Already generating, skipping');
      return;
    }

    // Create new abort controller
    generationAbortController.current = new AbortController();
    const signal = generationAbortController.current.signal;

    try {
      // Start timing for UX enhancement
      const startTime = Date.now();
      
      transitionTo('GENERATING', { 
        isSmartQR: options?.isSmartQR || false 
      });

      // Check if generation was aborted
      if (signal.aborted) {
        transitionTo('IDLE');
        return;
      }

      if (formData.barcode_type === 'qrcode' && options?.isSmartQR) {
        // Generate with v3 Enhanced for Smart QR
        // Map Smart QR config to backend format
        const smartConfig = options.smartQRConfig;
        
        console.log('=== SMART QR CONFIG MAPPING DEBUG ===');
        console.log('Input Smart Config:', JSON.stringify(smartConfig, null, 2));
        
        // When using a Smart QR with a specific eyeShape, don't use separated eye styles
        const hasSpecificEyeShape = smartConfig.eyeShape && smartConfig.eyeShape !== 'square';
        
        const customization: any = {
          // Check if template uses separated eye styles
          ...(smartConfig.eyeBorderStyle && smartConfig.eyeCenterStyle ? {
            eye_border_style: smartConfig.eyeBorderStyle,
            eye_center_style: smartConfig.eyeCenterStyle,
          } : {
            eye_shape: smartConfig.eyeShape,
          }),
          data_pattern: smartConfig.dataPattern,
          // Color configuration for Smart QR - backend requires both foreground and background
          // NOTE: Backend doesn't support transparent backgrounds yet, always use a hex color
          colors: {
            foreground: smartConfig.fgcolor || smartConfig.dataColor || '#000000',
            background: smartConfig.bgcolor || '#FFFFFF',
            // Add eye color if specified
            ...(smartConfig.eyeColor && { eyes: smartConfig.eyeColor })
          },
          effects: smartConfig.effects?.map((effect: string) => ({
            effect_type: effect === 'subtle-shadow' ? 'shadow' : effect,
            config: {}
          }))
        };

        // Map gradient format correctly
        if (smartConfig.gradient) {
          customization.gradient = {
            enabled: true,
            gradient_type: smartConfig.gradient.type || 'linear',
            colors: smartConfig.gradient.colors || ['#000000', '#666666'],
            angle: smartConfig.gradient.angle || 0,
            apply_to_data: true,
            apply_to_eyes: smartConfig.gradient.applyToEyes === true, // false por defecto
            stroke_style: smartConfig.gradient.borders ? {
              enabled: true,
              color: '#FFFFFF',
              width: 0.1,
              opacity: 0.3
            } : {
              enabled: false
            }
          };
          console.log('Mapped Gradient:', customization.gradient);
        }

        // Map logo format - backend expects 'data' not 'url' and all fields are required
        if (smartConfig.logo && smartConfig.logo.url) {
          try {
            // Load SVG and convert to Base64
            const logoData = await loadSvgAsBase64(smartConfig.logo.url);
            customization.logo = {
              data: logoData, // Now sending actual Base64 data
              size_percentage: Math.round((smartConfig.logo.size || 0.2) * 100), // Reduced from 0.3 to 0.2 (20%)
              padding: smartConfig.logo.padding || 8, // Reduced padding
              shape: smartConfig.logo.shape === 'rounded' ? 'rounded_square' : (smartConfig.logo.shape || 'square') // Map 'rounded' to 'rounded_square'
            };
            console.log('Mapped Logo with Base64 data:', { 
              ...customization.logo, 
              data: customization.logo.data.substring(0, 50) + '...' // Log only first 50 chars
            });
          } catch (error) {
            console.error('Failed to load logo:', error);
            // Continue without logo if loading fails
          }
        }

        // Map frame if exists
        if (smartConfig.frame) {
          customization.frame = {
            frame_type: smartConfig.frame.type || 'simple',
            text: smartConfig.frame.text || 'SCAN ME',
            text_position: 'bottom',
            color: '#000000'
          };
          console.log('Mapped Frame:', customization.frame);
        }
        
        console.log('Final Customization Object:', JSON.stringify(customization, null, 2));
        console.log('====================================');

        await v3Enhanced.generateEnhancedQR(
          formData.data,
          {
            // Use high error correction when logo is present for better QR readability
            error_correction: customization.logo ? 'H' : 'M',
            customization
          }
        );

        if (!signal.aborted) {
          // UX Enhancement: Ensure minimum loading time
          await ensureMinimumLoadingTime(startTime, signal, formData.data);
          
          if (!signal.aborted) {
            transitionTo('COMPLETE', { 
              hasEnhancedData: true,
              isSmartQR: true 
            });
          }
        }
      } else if (formData.barcode_type === 'qrcode') {
        // Generate with v3 Enhanced for regular QR
        console.log('[useQRGenerationState] Full formData.options:', JSON.stringify(formData.options, null, 2));
        console.log('[useQRGenerationState] use_separated_eye_styles:', formData.options?.use_separated_eye_styles);
        console.log('[useQRGenerationState] eye_shape:', formData.options?.eye_shape);
        console.log('[useQRGenerationState] eye_border_style:', formData.options?.eye_border_style);
        console.log('[useQRGenerationState] eye_center_style:', formData.options?.eye_center_style);
        
        const customizationConfig = {
          // Only include eye_shape if NOT using separated styles
          ...(formData.options?.use_separated_eye_styles ? {} : {
            eye_shape: formData.options?.eye_shape || 'square'
          }),
          // Only include separated styles if using separated mode
          ...(formData.options?.use_separated_eye_styles ? {
            eye_border_style: formData.options?.eye_border_style || 'square',
            eye_center_style: formData.options?.eye_center_style || 'square'
          } : {}),
          data_pattern: formData.options?.data_pattern || 'square',
          // Color configuration - backend requires both foreground and background
          // NOTE: Backend doesn't support transparent backgrounds yet, always use a hex color
          colors: {
            foreground: formData.options?.fgcolor || '#000000',
            background: formData.options?.bgcolor || '#FFFFFF'
          },
          // Add eye colors - convert new system to legacy format for backend compatibility
          ...(() => {
            // If using legacy eye_colors, use it directly
            if (formData.options?.eye_colors) {
              return {
                eye_colors: {
                  outer: formData.options.eye_colors.outer,
                  inner: formData.options.eye_colors.inner
                }
              };
            }
            
            // Convert new eye color system to legacy format
            let eyeColors: any = {};
            
            // Handle eye center colors
            if (formData.options?.eye_color_mode === 'solid' && formData.options?.eye_color_solid) {
              eyeColors.inner = formData.options.eye_color_solid;
            } else if (formData.options?.eye_color_mode === 'gradient' && formData.options?.eye_color_gradient?.color1) {
              // Use first color of gradient for now
              eyeColors.inner = formData.options.eye_color_gradient.color1;
            }
            
            // Handle eye border colors
            if (formData.options?.eye_border_color_mode === 'solid' && formData.options?.eye_border_color_solid) {
              eyeColors.outer = formData.options.eye_border_color_solid;
            } else if (formData.options?.eye_border_color_mode === 'gradient' && formData.options?.eye_border_color_gradient?.color1) {
              // Use first color of gradient for now
              eyeColors.outer = formData.options.eye_border_color_gradient.color1;
            }
            
            // Only include eye_colors if we have at least one color defined
            if (eyeColors.inner || eyeColors.outer) {
              return { eye_colors: eyeColors };
            }
            
            return {};
          })(),
          // Still pass the new fields for future backend support
          // ✅ Si apply_to_eyes es true y no hay modo específico, usar 'inherit'
          ...(formData.options?.eye_color_mode || (formData.options?.gradient_apply_to_eyes && formData.options?.gradient_enabled) ? {
            eye_color_mode: formData.options.eye_color_mode || 'inherit'
          } : {}),
          ...(formData.options?.eye_color_solid ? {
            eye_color_solid: formData.options.eye_color_solid
          } : {}),
          ...(formData.options?.eye_color_gradient ? {
            eye_color_gradient: formData.options.eye_color_gradient
          } : {}),
          // ✅ Si apply_to_eyes es true y no hay modo específico, usar 'inherit'
          ...(formData.options?.eye_border_color_mode || (formData.options?.gradient_apply_to_eyes && formData.options?.gradient_enabled) ? {
            eye_border_color_mode: formData.options.eye_border_color_mode || 'inherit'
          } : {}),
          ...(formData.options?.eye_border_color_solid ? {
            eye_border_color_solid: formData.options.eye_border_color_solid
          } : {}),
          ...(formData.options?.eye_border_color_gradient ? {
            eye_border_color_gradient: formData.options.eye_border_color_gradient
          } : {}),
          // Add eye gradient configuration if gradient mode is selected for borders OR if inherit mode with gradient enabled
          // ✅ También incluir cuando gradient_apply_to_eyes es true
          ...((formData.options?.eye_border_color_mode === 'gradient' && formData.options?.eye_border_color_gradient) || 
              (formData.options?.eye_border_color_mode === 'inherit' && formData.options?.gradient_enabled) ||
              (formData.options?.gradient_apply_to_eyes && formData.options?.gradient_enabled) ? {
            eye_border_gradient: {
              enabled: true,
              gradient_type: formData.options?.eye_border_color_mode === 'gradient' 
                ? (formData.options.eye_border_color_gradient?.type || 'radial')
                : (formData.options.gradient_type || 'linear'),
              colors: formData.options?.eye_border_color_mode === 'gradient'
                ? [
                    formData.options.eye_border_color_gradient?.color1,
                    formData.options.eye_border_color_gradient?.color2
                  ]
                : [
                    formData.options.gradient_color1 || '#000000',
                    formData.options.gradient_color2 || '#666666'
                  ]
            }
          } : {}),
          // Add eye center gradient configuration if gradient mode is selected for centers OR if inherit mode with gradient enabled
          // ✅ También incluir cuando gradient_apply_to_eyes es true
          ...((formData.options?.eye_color_mode === 'gradient' && formData.options?.eye_color_gradient) ||
              (formData.options?.eye_color_mode === 'inherit' && formData.options?.gradient_enabled) ||
              (formData.options?.gradient_apply_to_eyes && formData.options?.gradient_enabled) ? {
            eye_center_gradient: {
              enabled: true,
              gradient_type: formData.options?.eye_color_mode === 'gradient'
                ? (formData.options.eye_color_gradient?.type || 'radial')
                : (formData.options.gradient_type || 'linear'),
              colors: formData.options?.eye_color_mode === 'gradient'
                ? [
                    formData.options.eye_color_gradient?.color1,
                    formData.options.eye_color_gradient?.color2
                  ]
                : [
                    formData.options.gradient_color1 || '#000000',
                    formData.options.gradient_color2 || '#666666'
                  ]
            }
          } : {}),
          // Add fixed size if specified
          ...(formData.options?.fixed_size && formData.options.fixed_size !== 'auto' ? {
            fixed_size: formData.options.fixed_size
          } : {}),
          // Gradient configuration - only for data pattern
          gradient: formData.options?.gradient_enabled ? {
            enabled: true,
            gradient_type: formData.options.gradient_type || 'linear',
            colors: [
              formData.options.gradient_color1 || '#000000',
              formData.options.gradient_color2 || '#666666'
            ],
            apply_to_data: true,
            apply_to_eyes: formData.options?.gradient_apply_to_eyes ?? true,  // Default true como página principal
            per_module: formData.options?.gradient_per_module || false,
            stroke_style: formData.options?.gradient_borders ? {
              enabled: true,
              color: '#FFFFFF',
              width: 0.1,
              opacity: 0.3
            } : {
              enabled: false
            }
          } : undefined,
          logo: formData.options?.logo_enabled && formData.options?.logo_data ? {
            data: formData.options.logo_data,
            size_percentage: formData.options.logo_size || 20,
            shape: formData.options.logo_shape || 'square',
            padding: formData.options.logo_padding || 5
          } : undefined,
          effects: formData.options?.effects && formData.options.effects.length > 0 ? 
            formData.options.effects.map((effect: string) => ({
              effect_type: effect as 'shadow' | 'glow' | 'blur' | 'noise' | 'vintage',
              config: {}
            })) : undefined,
          // MARCO TEMPORALMENTE DESHABILITADO - Para sincronizar con página principal
          // TODO: Reactivar cuando se decida incluir marcos en el QR principal
          // Para reactivar, descomentar el siguiente bloque:
          /*
          frame: formData.options?.frame_enabled !== false ? {
            frame_type: formData.options?.frame_style || 'simple',
            text: formData.options?.frame_text || 'ESCANEA AQUÍ',
            text_position: formData.options?.frame_text_position || 'bottom',
            color: formData.options?.fgcolor || '#000000'
          } : undefined
          */
          frame: undefined  // Deshabilitado temporalmente
        };
        
        console.log('[useQRGenerationState] Final customizationConfig:', JSON.stringify(customizationConfig, null, 2));
        
        await v3Enhanced.generateEnhancedQR(
          formData.data,
          {
            error_correction: formData.options?.ecl || 'M',
            customization: customizationConfig
          }
        );

        if (!signal.aborted) {
          // UX Enhancement: Ensure minimum loading time
          await ensureMinimumLoadingTime(startTime, signal, formData.data);
          
          if (!signal.aborted) {
            transitionTo('COMPLETE', { 
              hasEnhancedData: true,
              isSmartQR: false 
            });
          }
        }
      } else {
        // Generate other barcode types with v2
        await v2Barcode.generateBarcode(formData);

        if (!signal.aborted) {
          // UX Enhancement: Ensure minimum loading time
          await ensureMinimumLoadingTime(startTime, signal, formData.data);
          
          if (!signal.aborted) {
            transitionTo('COMPLETE', { 
              hasEnhancedData: false,
              isSmartQR: false 
            });
          }
        }
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('[useQRGenerationState] Generation error:', error);
        transitionTo('ERROR', { 
          error: error instanceof Error ? error.message : 'Generation failed' 
        });
      }
    } finally {
      generationAbortController.current = null;
    }
  }, [transitionTo, v3Enhanced, v2Barcode]);

  // Reset to idle state
  const reset = useCallback(() => {
    // Abort any ongoing generation
    if (generationAbortController.current) {
      generationAbortController.current.abort();
      generationAbortController.current = null;
    }

    // Clear data from generation hooks
    v3Enhanced.clearData();
    v2Barcode.clearContent();

    transitionTo('IDLE', {
      data: '',
      isSmartQR: false,
      hasEnhancedData: false,
      error: null
    });
  }, [transitionTo, v3Enhanced, v2Barcode]);

  // QR Content Generation helper
  const generateQRContent = useCallback((type: string, data: any): string => {
    // If no data provided, use empty form data
    if (!data) {
      const defaults = qrDefaultValues[type as keyof typeof qrDefaultValues];
      data = defaults || {};
    }
    
    // Get default values for this type
    const defaults = qrDefaultValues[type as keyof typeof qrDefaultValues];
    
    // Helper to get value with fallback to default
    const getValueWithDefault = (field: string) => {
      const value = (data as any)[field];
      return value && value.trim() !== '' ? value : (defaults as any)?.[field] || '';
    };
    
    switch (type) {
      case 'email':
        const email = getValueWithDefault('email');
        const subject = getValueWithDefault('subject');
        const message = getValueWithDefault('message');
        return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        
      case 'call':
        const callPhone = getValueWithDefault('phoneNumber');
        const callCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        return `tel:${callCountry}${callPhone}`;
        
      case 'sms':
        const smsPhone = getValueWithDefault('phoneNumber');
        const smsMessage = getValueWithDefault('message');
        const smsCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        return `sms:${smsCountry}${smsPhone}?body=${encodeURIComponent(smsMessage)}`;
        
      case 'whatsapp':
        const waPhone = getValueWithDefault('phoneNumber');
        const waMessage = getValueWithDefault('message');
        const waCountry = (data as any).countryCode || (defaults as any)?.countryCode || '+1';
        const whatsappNumber = `${waCountry}${waPhone}`.replace(/\D/g, '');
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;
        
      case 'wifi':
        const networkName = getValueWithDefault('networkName');
        const password = getValueWithDefault('password');
        const security = (data as any).security || (defaults as any)?.security || 'WPA';
        const hidden = (data as any).hidden !== undefined ? (data as any).hidden : (defaults as any)?.hidden || false;
        return `WIFI:T:${security};S:${networkName};P:${password};H:${hidden ? 'true' : 'false'};;`;
        
      case 'vcard':
        const firstName = getValueWithDefault('firstName');
        const lastName = getValueWithDefault('lastName');
        const organization = getValueWithDefault('organization');
        const title = getValueWithDefault('title');
        const phone = getValueWithDefault('phone');
        const vcardEmail = getValueWithDefault('email');
        const website = getValueWithDefault('website');
        const address = getValueWithDefault('address');
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${firstName} ${lastName}\nORG:${organization}\nTITLE:${title}\nTEL:${phone}\nEMAIL:${vcardEmail}\nURL:${website}\nADR:;;${address};;;;\nEND:VCARD`;
        
      case 'text':
        return getValueWithDefault('message');
        
      case 'link':
        return getValueWithDefault('url');
        
      default:
        return 'Generador QR';
    }
  }, []);

  return {
    // Current state
    state: stateData.state,
    stateData,
    
    // State transitions
    setTyping,
    setValidating,
    setReadyToGenerate,
    generateQR,
    reset,
    
    // QR Content generation
    generateQRContent,
    
    // Generation data
    enhancedData: v3Enhanced.enhancedData,
    svgContent: v2Barcode.svgContent,
    isLoading: v3Enhanced.isLoading || v2Barcode.isLoading,
    error: stateData.error || v3Enhanced.error || v2Barcode.serverError?.error || null,
    scannabilityAnalysis: v3Enhanced.scannability,
    
    // Flags
    isUsingV3Enhanced: stateData.state === 'COMPLETE' && stateData.hasEnhancedData,
    isSmartQR: stateData.isSmartQR
  };
};