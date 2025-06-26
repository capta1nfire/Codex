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
      // Validate state transitions
      const validTransitions: Record<GenerationState, GenerationState[]> = {
        'IDLE': ['TYPING', 'GENERATING', 'VALIDATING', 'IDLE'], // Allow IDLE->IDLE for reset
        'TYPING': ['IDLE', 'VALIDATING', 'TYPING'], // Allow TYPING->TYPING for continuous typing
        'VALIDATING': ['READY_TO_GENERATE', 'ERROR', 'IDLE', 'VALIDATING', 'TYPING'],
        'READY_TO_GENERATE': ['GENERATING', 'IDLE', 'TYPING'],
        'GENERATING': ['COMPLETE', 'ERROR', 'IDLE'], // Allow cancel to IDLE
        'COMPLETE': ['IDLE', 'TYPING', 'GENERATING', 'VALIDATING'], // Allow immediate re-generation
        'ERROR': ['IDLE', 'TYPING', 'GENERATING'] // Allow retry from error
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
    transitionTo('VALIDATING');
  }, [transitionTo]);

  // Handle ready to generate state
  const setReadyToGenerate = useCallback(() => {
    transitionTo('READY_TO_GENERATE');
  }, [transitionTo]);

  // Helper function to load SVG and convert to Base64
  const loadSvgAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status}`);
      }
      let svgText = await response.text();
      
      // Make gradient IDs unique to avoid conflicts
      const uniqueId = Math.random().toString(36).substr(2, 9);
      svgText = svgText.replace(/id="([^"]*)"/g, `id="$1-${uniqueId}"`);
      svgText = svgText.replace(/url\(#([^)]*)\)/g, `url(#$1-${uniqueId})`);
      
      // Convert SVG text to Base64
      const base64 = btoa(unescape(encodeURIComponent(svgText)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error('Error loading SVG:', error);
      throw error;
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
        
        const customization: any = {
          eye_shape: smartConfig.eyeShape,
          data_pattern: smartConfig.dataPattern,
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
            apply_to_eyes: false
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
          transitionTo('COMPLETE', { 
            hasEnhancedData: true,
            isSmartQR: true 
          });
        }
      } else if (formData.barcode_type === 'qrcode') {
        // Generate with v3 Enhanced for regular QR
        await v3Enhanced.generateEnhancedQR(
          formData.data,
          {
            error_correction: formData.options?.ecl || 'M',
            customization: {
              eye_shape: formData.options?.eye_shape,
              data_pattern: formData.options?.data_pattern,
              gradient: formData.options?.gradient_enabled ? {
                enabled: true,
                gradient_type: formData.options.gradient_type || 'linear',
                colors: [
                  formData.options.gradient_color1 || '#000000',
                  formData.options.gradient_color2 || '#666666'
                ],
                apply_to_data: true,
                apply_to_eyes: false
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
              frame: formData.options?.frame_enabled ? {
                frame_type: formData.options.frame_style || 'simple',
                text: formData.options.frame_text || 'SCAN ME',
                text_position: formData.options.frame_text_position || 'bottom',
                color: formData.options.fgcolor || '#000000'
              } : undefined
            }
          }
        );

        if (!signal.aborted) {
          transitionTo('COMPLETE', { 
            hasEnhancedData: true,
            isSmartQR: false 
          });
        }
      } else {
        // Generate other barcode types with v2
        await v2Barcode.generateBarcode(formData);

        if (!signal.aborted) {
          transitionTo('COMPLETE', { 
            hasEnhancedData: false,
            isSmartQR: false 
          });
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
        return 'CODEX QR Generator';
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
    
    // Flags
    isUsingV3Enhanced: stateData.state === 'COMPLETE' && stateData.hasEnhancedData,
    isSmartQR: stateData.isSmartQR
  };
};