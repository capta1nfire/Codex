/**
 * QR Generator Orchestrator Hook
 * 
 * A state machine implementation that orchestrates the entire QR/Barcode generation flow.
 * Manages state transitions, side effects, and coordination between components.
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  GeneratorState,
  GeneratorEvent,
  GeneratorContext,
  TYPING_DEBOUNCE_MS,
  POST_VALIDATION_DELAY_MS,
  AUTO_GENERATION_DELAY_MS
} from '@/types/generatorStates';
import { useUrlValidation } from '@/hooks/useUrlValidation';
import { useQRGenerationState } from '@/hooks/useQRGenerationState';
import { SmartValidators } from '@/lib/smartValidation';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioConfigType } from '@/types/studio.types';

// Initial context with Studio integration
const createInitialContext = (studioConfig?: any): GeneratorContext => {
  // Default values
  const defaultOptions = {
    size: 300,
    scale: 2,
    margin: 4,
    errorCorrectionLevel: 'M',
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    gradient_enabled: true,
    gradient_type: 'radial',
    gradient_colors: ['#000000', '#666666'],
    eyeShape: 'rounded',
    dataShape: 'square'
  };

  // If Studio config is available, merge it with defaults
  if (studioConfig) {
    // Map Studio config to generator options
    const mappedOptions = {
      ...defaultOptions,
      fgColor: studioConfig.colors?.foreground || defaultOptions.fgColor,
      bgColor: studioConfig.colors?.background || defaultOptions.bgColor,
      gradient_enabled: studioConfig.gradient?.enabled || defaultOptions.gradient_enabled,
      gradient_type: studioConfig.gradient?.gradient_type || defaultOptions.gradient_type,
      gradient_colors: studioConfig.gradient?.colors || defaultOptions.gradient_colors,
      eyeShape: studioConfig.eye_shape || 
                (studioConfig.use_separated_eye_styles ? undefined : studioConfig.eye_border_style),
      eye_border_style: studioConfig.eye_border_style,
      eye_center_style: studioConfig.eye_center_style,
      use_separated_eye_styles: studioConfig.use_separated_eye_styles,
      dataShape: studioConfig.data_pattern || defaultOptions.dataShape,
      errorCorrectionLevel: studioConfig.error_correction || defaultOptions.errorCorrectionLevel
    };

    return {
      // Form data
      barcodeType: 'qrcode',
      qrType: 'link',
      formData: {
        url: studioConfig.template_data?.url || 'https://tu-sitio-web.com'
      },
      options: mappedOptions,
      
      // Validation state
      lastValidatedUrl: '',
      validationMetadata: null,
      isUrlValid: false,
      
      // Generation state
      svgContent: null,
      enhancedData: null,
      scannabilityAnalysis: null,
      lastGeneratedData: '',
      hasGeneratedInitial: false,
      
      // UI state
      isTyping: false,
      hasUserStartedTyping: false,
      shouldAutoGenerate: true,
      isUserEditing: false,
      dynamicDebounceTime: TYPING_DEBOUNCE_MS
    };
  }

  // Return default context if no Studio config
  return {
    // Form data
    barcodeType: 'qrcode',
    qrType: 'link',
    formData: {
      url: 'https://tu-sitio-web.com'
    },
    options: defaultOptions,
    
    // Validation state
    lastValidatedUrl: '',
    validationMetadata: null,
    isUrlValid: false,
    
    // Generation state
    svgContent: null,
    enhancedData: null,
    scannabilityAnalysis: null,
    lastGeneratedData: '',
    hasGeneratedInitial: false,
    
    // UI state
    isTyping: false,
    hasUserStartedTyping: false,
    shouldAutoGenerate: true,
    isUserEditing: false,
    dynamicDebounceTime: TYPING_DEBOUNCE_MS
  };
};

// State machine reducer
function generatorReducer(
  state: GeneratorState,
  event: GeneratorEvent
): GeneratorState {
  // Clear any existing timers when transitioning states
  if (state.context.typingTimer) clearTimeout(state.context.typingTimer);
  if (state.context.validationTimer) clearTimeout(state.context.validationTimer);
  if (state.context.generationTimer) clearTimeout(state.context.generationTimer);
  if (state.context.postValidationTimer) clearTimeout(state.context.postValidationTimer);

  switch (state.value) {
    case 'idle':
      switch (event.type) {
        case 'FORM_CHANGE':
          return {
            value: 'typing',
            context: {
              ...state.context,
              isTyping: true,
              hasUserStartedTyping: true,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              }
            }
          };
        case 'START_GENERATION':
          return {
            value: 'generating',
            context: state.context
          };
        case 'CHANGE_BARCODE_TYPE':
          return {
            value: 'idle',
            context: {
              ...createInitialContext(),
              barcodeType: event.barcodeType,
              qrType: event.barcodeType === 'qrcode' ? 'link' : '',
              formData: { data: '' },
              hasGeneratedInitial: true
            }
          };
        case 'SET_EDITING_INTENT':
          return {
            value: state.value,
            context: {
              ...state.context,
              isUserEditing: event.isEditing,
              dynamicDebounceTime: event.debounceTime || state.context.dynamicDebounceTime
            }
          };
        default:
          return state;
      }

    case 'typing':
      switch (event.type) {
        case 'FORM_CHANGE':
          return {
            value: 'typing',
            context: {
              ...state.context,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              }
            }
          };
        case 'STOP_TYPING':
          // If user is editing, stay in typing state
          if (state.context.isUserEditing) {
            return state;
          }
          // Transition to validation if it's a URL
          if (shouldValidateUrl(state.context)) {
            return {
              value: 'validating',
              context: {
                ...state.context,
                isTyping: false
              }
            };
          }
          // Otherwise go to ready state
          return {
            value: 'ready',
            context: {
              ...state.context,
              isTyping: false
            }
          };
        case 'UPDATE_OPTIONS':
          return {
            value: 'ready',
            context: {
              ...state.context,
              options: {
                ...state.context.options,
                ...event.options
              },
              isTyping: false
            }
          };
        case 'SET_EDITING_INTENT':
          return {
            value: state.value,
            context: {
              ...state.context,
              isUserEditing: event.isEditing,
              dynamicDebounceTime: event.debounceTime || state.context.dynamicDebounceTime
            }
          };
        default:
          return state;
      }

    case 'validating':
      switch (event.type) {
        case 'VALIDATION_SUCCESS':
          return {
            value: 'ready',
            context: {
              ...state.context,
              validationMetadata: event.metadata,
              isUrlValid: event.metadata.exists,
              lastValidatedUrl: state.context.formData.url || ''
            }
          };
        case 'VALIDATION_FAILURE':
          return {
            value: 'ready',
            context: {
              ...state.context,
              validationMetadata: { exists: false, error: event.error },
              isUrlValid: false,
              lastValidatedUrl: state.context.formData.url || ''
            }
          };
        case 'FORM_CHANGE':
          // If user starts typing while validating, go back to typing
          return {
            value: 'typing',
            context: {
              ...state.context,
              isTyping: true,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              }
            }
          };
        case 'SET_EDITING_INTENT':
          return {
            value: state.value,
            context: {
              ...state.context,
              isUserEditing: event.isEditing,
              dynamicDebounceTime: event.debounceTime || state.context.dynamicDebounceTime
            }
          };
        default:
          return state;
      }

    case 'ready':
      switch (event.type) {
        case 'START_GENERATION':
          return {
            value: 'generating',
            context: state.context
          };
        case 'FORM_CHANGE':
          return {
            value: 'typing',
            context: {
              ...state.context,
              isTyping: true,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              }
            }
          };
        case 'GENERATE_ANYWAY':
          return {
            value: 'generating',
            context: {
              ...state.context,
              isUrlValid: true // Override validation
            }
          };
        case 'UPDATE_OPTIONS':
          return {
            value: 'ready',
            context: {
              ...state.context,
              options: {
                ...state.context.options,
                ...event.options
              }
            }
          };
        case 'SET_EDITING_INTENT':
          return {
            value: state.value,
            context: {
              ...state.context,
              isUserEditing: event.isEditing,
              dynamicDebounceTime: event.debounceTime || state.context.dynamicDebounceTime
            }
          };
        default:
          return state;
      }

    case 'generating':
      switch (event.type) {
        case 'GENERATION_SUCCESS':
          return {
            value: 'complete',
            context: {
              ...state.context,
              svgContent: event.svgContent,
              enhancedData: event.enhancedData,
              scannabilityAnalysis: event.scannabilityAnalysis,
              lastGeneratedData: JSON.stringify(state.context.formData),
              hasGeneratedInitial: true
            }
          };
        case 'GENERATION_FAILURE':
          return {
            value: 'error',
            context: {
              ...state.context,
              error: event.error
            }
          };
        default:
          return state;
      }

    case 'complete':
      switch (event.type) {
        case 'FORM_CHANGE':
          return {
            value: 'typing',
            context: {
              ...state.context,
              isTyping: true,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              }
            }
          };
        case 'UPDATE_OPTIONS':
          return {
            value: 'ready',
            context: {
              ...state.context,
              options: {
                ...state.context.options,
                ...event.options
              }
            }
          };
        case 'RESET':
          return {
            value: 'idle',
            context: createInitialContext()
          };
        case 'SET_EDITING_INTENT':
          return {
            value: state.value,
            context: {
              ...state.context,
              isUserEditing: event.isEditing,
              dynamicDebounceTime: event.debounceTime || state.context.dynamicDebounceTime
            }
          };
        default:
          return state;
      }

    case 'error':
      switch (event.type) {
        case 'RESET':
          return {
            value: 'idle',
            context: createInitialContext()
          };
        case 'FORM_CHANGE':
          return {
            value: 'typing',
            context: {
              ...state.context,
              isTyping: true,
              formData: {
                ...state.context.formData,
                [event.field]: event.value
              },
              error: undefined
            }
          };
        default:
          return state;
      }

    default:
      return state;
  }
}

// Helper functions
function shouldValidateUrl(context: GeneratorContext): boolean {
  if (context.barcodeType !== 'qrcode') return false;
  if (context.qrType !== 'link') return false;
  
  const url = context.formData.url || '';
  if (!url || url === context.lastValidatedUrl) return false;
  
  const validation = SmartValidators.url(url);
  return validation.isValid;
}

function hasFormDataChanged(context: GeneratorContext): boolean {
  const currentData = JSON.stringify(context.formData);
  return currentData !== context.lastGeneratedData;
}

// Main hook
export function useQRGeneratorOrchestrator() {
  // Get Studio context
  const { getConfigByType } = useStudio();
  
  // Get placeholder config from Studio on initial load
  const placeholderConfig = getConfigByType(StudioConfigType.PLACEHOLDER)?.config;
  
  const [state, dispatch] = useReducer(generatorReducer, {
    value: 'idle',
    context: createInitialContext(placeholderConfig)
  } as GeneratorState);

  // Refs for managing timers
  const typingTimerRef = useRef<NodeJS.Timeout>();
  const validationTimerRef = useRef<NodeJS.Timeout>();
  const generationTimerRef = useRef<NodeJS.Timeout>();
  const postValidationTimerRef = useRef<NodeJS.Timeout>();

  // External hooks
  const { validateUrl } = useUrlValidation();
  const { 
    generateQR, 
    reset: resetGeneration,
    svgContent: generatedSvgContent,
    enhancedData: generatedEnhancedData,
    scannabilityAnalysis: generatedScannabilityAnalysis
  } = useQRGenerationState();

  // Handle typing debounce with dynamic timing
  useEffect(() => {
    if (state.value === 'typing') {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Use dynamic debounce time based on user editing behavior
      const debounceTime = state.context.dynamicDebounceTime || TYPING_DEBOUNCE_MS;
      
      typingTimerRef.current = setTimeout(() => {
        dispatch({ type: 'STOP_TYPING' });
      }, debounceTime);
    }
  }, [state.value, state.context.formData, state.context.dynamicDebounceTime]);

  // Handle validation
  useEffect(() => {
    if (state.value === 'validating') {
      const url = state.context.formData.url || '';
      
      validateUrl(url).then(
        (metadata) => {
          dispatch({ 
            type: 'VALIDATION_SUCCESS', 
            metadata: metadata || { exists: false }
          });
        },
        (error) => {
          dispatch({ 
            type: 'VALIDATION_FAILURE', 
            error: error.message 
          });
        }
      );
    }
  }, [state.value, state.context.formData.url]);

  // Handle auto-generation
  useEffect(() => {
    if (state.value === 'ready' && state.context.shouldAutoGenerate) {
      if (!state.context.hasGeneratedInitial || hasFormDataChanged(state.context)) {
        if (postValidationTimerRef.current) {
          clearTimeout(postValidationTimerRef.current);
        }
        
        const delay = state.context.validationMetadata 
          ? POST_VALIDATION_DELAY_MS 
          : AUTO_GENERATION_DELAY_MS;
        
        postValidationTimerRef.current = setTimeout(() => {
          dispatch({ type: 'START_GENERATION' });
        }, delay);
      }
    }
  }, [state.value, state.context.shouldAutoGenerate, state.context.formData]);

  // Handle generation
  useEffect(() => {
    if (state.value === 'generating') {
      const generateData = {
        barcode_type: state.context.barcodeType,
        data: state.context.formData.url || state.context.formData.text || '',
        options: state.context.options
      };

      // Call generateQR without expecting a return value
      generateQR(generateData).catch((error) => {
        dispatch({
          type: 'GENERATION_FAILURE',
          error: error
        });
      });
    }
  }, [state.value]);

  // Update state when generation completes
  useEffect(() => {
    console.log('[Orchestrator] useEffect triggered:', {
      stateValue: state.value,
      generatedSvgContent: !!generatedSvgContent,
      generatedEnhancedData: !!generatedEnhancedData,
      generatedScannabilityAnalysis: !!generatedScannabilityAnalysis,
      scannabilityValue: generatedScannabilityAnalysis,
      condition: state.value === 'generating' && (generatedSvgContent || generatedEnhancedData)
    });
    
    if (state.value === 'generating' && (generatedSvgContent || generatedEnhancedData)) {
      console.log('[Orchestrator] GENERATION_SUCCESS event data:', {
        svgContent: !!generatedSvgContent,
        enhancedData: !!generatedEnhancedData,
        scannabilityAnalysis: generatedScannabilityAnalysis
      });
      dispatch({
        type: 'GENERATION_SUCCESS',
        svgContent: generatedSvgContent,
        enhancedData: generatedEnhancedData || null,
        scannabilityAnalysis: generatedScannabilityAnalysis || null
      });
    }
  }, [generatedSvgContent, generatedEnhancedData, generatedScannabilityAnalysis, state.value]);

  // Public API
  const api = {
    // State
    state: state.value,
    context: state.context,
    
    // Actions
    updateForm: useCallback((field: string, value: any) => {
      dispatch({ type: 'FORM_CHANGE', field, value });
    }, []),
    
    updateOptions: useCallback((options: Partial<GeneratorContext['options']>) => {
      dispatch({ type: 'UPDATE_OPTIONS', options });
    }, []),
    
    changeBarcodeType: useCallback((barcodeType: string) => {
      dispatch({ type: 'CHANGE_BARCODE_TYPE', barcodeType });
    }, []),
    
    changeQRType: useCallback((qrType: string) => {
      dispatch({ type: 'CHANGE_QR_TYPE', qrType });
    }, []),
    
    generateNow: useCallback(() => {
      dispatch({ type: 'START_GENERATION' });
    }, []),
    
    generateAnyway: useCallback(() => {
      dispatch({ type: 'GENERATE_ANYWAY' });
    }, []),
    
    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
    
    setEditingIntent: useCallback((isEditing: boolean, debounceTime?: number) => {
      dispatch({ type: 'SET_EDITING_INTENT', isEditing, debounceTime });
    }, []),
    
    // Computed values
    isLoading: state.value === 'generating' || state.value === 'validating',
    hasError: state.value === 'error',
    canGenerate: state.value === 'ready' || state.value === 'complete',
    showValidationFeedback: state.context.validationMetadata !== null,
    needsUrlValidation: state.context.barcodeType === 'qrcode' && state.context.qrType === 'link'
  };

  return api;
}