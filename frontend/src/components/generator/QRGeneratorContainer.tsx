/**
 * QRGeneratorContainer - Main container orchestrating all generator components
 * 
 * Architecture:
 * - Modular component composition
 * - State management via custom hooks
 * - Lazy loading for performance
 * - Responsive design patterns
 */

import React, { useState, useCallback, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { defaultFormValues } from '@/constants/defaultFormValues';
import debounce from 'lodash/debounce';

// Layout components
import { GeneratorLayout } from './layout/GeneratorLayout';
import { GeneratorHeader } from './layout/GeneratorHeader';

// Workspace components
import { DataCard } from './workspace/DataCard';
import { OptionsCard } from './workspace/OptionsCard';
import { PreviewSection } from './PreviewSectionV3';
import { SmartQRButton } from '@/features/smart-qr/components';

// UI components
// Card components removed - using div with column-card class for consistency

// Type selector
import { BarcodeTypeTabs } from './BarcodeTypeTabs';

// Custom hooks - EXACTOS del original
import { useQRGenerationState } from '@/hooks/useQRGenerationState';
import { useUrlValidation } from '@/hooks/useUrlValidation';
import { useTypingTracker } from '@/hooks/useTypingTracker';
import { useStudio } from '@/components/studio/StudioProvider';
import { StudioConfigType } from '@/types/studio.types';
import { api } from '@/lib/api';

// Constantes del original
import { getDefaultDataForType } from '@/constants/barcodeTypes';

// Validación del original
import { SmartValidators } from '@/lib/smartValidation';

// Lazy load marketing components
const GeneratorMarketingZone = lazy(() => import('./marketing/GeneratorMarketingZone'));

export function QRGeneratorContainer() {
  console.log('[QRGeneratorContainer] Component mounting...');
  
  // Get Studio context for placeholder config
  const { getConfigByType, configs } = useStudio();
  
  // Estados principales - EXACTOS del original
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [realTimeValidationError, setRealTimeValidationError] = useState<string | null>(null);
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);
  const [autoGenerationEnabled] = useState(true); // Enable auto-generation by default
  const [shouldRefreshPlaceholder, setShouldRefreshPlaceholder] = useState(false);
  
  // Estados para validación de existencia de URL - EXACTOS del original
  const [urlValidationState, setUrlValidationState] = useState<{
    isValidating: boolean;
    exists: boolean | null;
    shouldGenerateAnyway: boolean;
  }>({
    isValidating: false,
    exists: null,
    shouldGenerateAnyway: false
  });
  
  // Refs críticos del original
  const lastValidatedUrl = useRef<string>('');
  const hasGeneratedInitialQR = useRef(false);
  const lastGeneratedData = useRef<string>('');
  const postValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State management centralizado - EXACTO del original
  const qrGenerationState = useQRGenerationState();
  
  const { 
    state: generationState,
    enhancedData,
    svgContent,
    isLoading,
    error: generationError,
    scannabilityAnalysis,
    generateQR: generateWithState,
    setTyping: setGenerationTyping,
    setValidating: setGenerationValidating,
    setReadyToGenerate: setGenerationReady,
    reset: resetGeneration
  } = qrGenerationState;

  // Debug scannability data flow
  useEffect(() => {
    if (scannabilityAnalysis) {
      console.log('[QRGeneratorContainer] Scannability data received:', scannabilityAnalysis);
    }
  }, [scannabilityAnalysis]);

  // QR Content generation state - EXACTO del original
  const [selectedQRType, setSelectedQRType] = useState<string>('link');
  const [qrFormData, setQrFormData] = useState<Record<string, any>>({
    email: { email: '', subject: '', message: '' },
    call: { countryCode: '+1', phoneNumber: '' },
    sms: { countryCode: '+1', phoneNumber: '', message: '' },
    whatsapp: { countryCode: '+1', phoneNumber: '', message: '' },
    wifi: { networkName: '', password: '', security: 'WPA', hidden: false },
    vcard: { 
      firstName: '', lastName: '', organization: '', title: '',
      phone: '', email: '', website: '', address: '' 
    },
    text: { message: '' },
    link: { url: 'https://tu-sitio-web.com' }
  });

  // Form state management
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onBlur',
    defaultValues: defaultFormValues,
  });

  // Observar valores del formulario - EXACTO del original
  const selectedType = watch('barcode_type');
  const watchedData = watch('data');
  const watchedOptions = watch('options');

  // URL validation hook - EXACTO del original
  const { 
    isValidating: isValidatingUrl, 
    metadata: urlMetadata, 
    error: urlValidationError, 
    validateUrl,
    clearValidation: clearUrlValidation
  } = useUrlValidation({
    enabled: true,
    debounceMs: 500  // Reduced from 800ms to 500ms for faster validation
  });



  // updateQRFormData - SIMPLIFICADO para prevenir bucles
  const updateQRFormData = useCallback((type: string, field: string, value: any) => {
    console.log('[updateQRFormData] Updating:', { type, field, value });
    
    // SOLO actualizar estado, NO generar automáticamente
    setQrFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    
    // Generar contenido QR pero NO disparar generación automática
    const updatedData = {
      ...qrFormData[type],
      [field]: value
    };
    
    const result = qrGenerationState.generateQRContent(type, updatedData);
    console.log('[updateQRFormData] Generated content (no auto-gen):', result);
    
    return result;
  }, [qrFormData, qrGenerationState]);

  // Typing tracker - USES CENTRALIZED GENERATION
  const { isTyping, trackInput, resetTyping } = useTypingTracker({
    typingDebounceMs: 500,  // Ligeramente aumentado para testing (era 150ms)
    onStopTyping: () => {
      // Generar cuando el usuario deja de escribir
      if (selectedType === 'qrcode' && hasUserStartedTyping) {
        const currentFormValues = getValues();
        const currentQRData = qrFormData[selectedQRType];
        
        // Use centralized state machine to coordinate validation and generation
        if (selectedQRType === 'link') {
          // Only transition to validating if we're in a state that allows it
          if (generationState === 'TYPING' || generationState === 'IDLE' || generationState === 'ERROR' || generationState === 'COMPLETE') {
            setGenerationValidating();
          }
        } else {
          // Non-URL QR types use centralized generation
          onSubmit(currentFormValues);
        }
      }
    }
  });

  // Estados unificados para UI - EXACTO del original
  const serverError = generationError;
  const clearError = useCallback(() => resetGeneration(), [resetGeneration]);
  const clearContent = useCallback(() => resetGeneration(), [resetGeneration]);

  // Handlers - EXACTOS del original
  const lastGeneratedOptions = useRef<string>('');
  
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    // Check if this is a Smart QR with specific eye shape
    const hasSmartQREyeShape = formData.options?.eye_shape && 
                               formData.options.eye_shape !== 'square' && 
                               formData.options.eye_shape !== undefined;
    
    // If Smart QR has specific eye shape, disable separated eye styles
    if (hasSmartQREyeShape && formData.options) {
      formData.options.use_separated_eye_styles = false;
    }
    
    // Debug form data
    console.log('[onSubmit] Full form data:', JSON.stringify(formData, null, 2));
    console.log('[onSubmit] Eye styles:', {
      use_separated: formData.options?.use_separated_eye_styles,
      eye_shape: formData.options?.eye_shape,
      eye_border_style: formData.options?.eye_border_style,
      eye_center_style: formData.options?.eye_center_style,
      hasSmartQREyeShape
    });
    
    // Create a hash of both data and relevant options for duplicate detection
    const optionsHash = JSON.stringify({
      ...formData.options,
      // Exclude non-visual options from comparison
      scale: undefined,
      height: undefined,
      includetext: undefined
    });
    
    // Prevent duplicate generation for same data AND options
    if (lastGeneratedData.current === formData.data && 
        lastGeneratedOptions.current === optionsHash && 
        generationState === 'COMPLETE') {
      console.log('[onSubmit] Skipping duplicate generation - no visual changes');
      return;
    }
    
    lastGeneratedData.current = formData.data;
    lastGeneratedOptions.current = optionsHash;
    await generateWithState(formData);
  }, [generateWithState, generationState]);

  // Debounced version of onSubmit to prevent multiple rapid calls
  const debouncedOnSubmit = useMemo(
    () => debounce(onSubmit, 300, { leading: true, trailing: false }),
    [onSubmit]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedOnSubmit.cancel();
    };
  }, [debouncedOnSubmit]);

  // Hook de auto-generación inteligente - MOVED AFTER onSubmit

  const handleTypeChange = useCallback(async (newType: string) => {
    resetTyping();
    
    const newData = getDefaultDataForType(newType);
    setValue('barcode_type', newType, { shouldValidate: true });
    setValue('data', newData, { shouldValidate: true });
    clearError();

    const currentFormValues = getValues();
    const completeFormValues = {
      ...currentFormValues,
      barcode_type: newType,
      data: newData,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, onSubmit, getValues, clearError, resetTyping]);

  const handleQRTypeChange = useCallback(async (newQRType: string) => {
    setSelectedQRType(newQRType);
    
    if (postValidationTimeoutRef.current) {
      clearTimeout(postValidationTimeoutRef.current);
      postValidationTimeoutRef.current = null;
    }
    
    if (newQRType === 'link') {
      setHasUserStartedTyping(false);
      clearUrlValidation();
      resetGeneration();
      setUrlValidationState({
        isValidating: false,
        exists: null,
        shouldGenerateAnyway: false
      });
    } else {
      clearUrlValidation();
      resetGeneration();
    }
    resetTyping();
    
    lastValidatedUrl.current = '';
    
    const initialData = qrFormData[newQRType];
    const qrContent = qrGenerationState.generateQRContent(newQRType, initialData);
    
    setValue('data', qrContent, { shouldValidate: true });
    
    const currentFormValues = getValues();
    const completeFormValues = {
      ...currentFormValues,
      data: qrContent,
      options: {
        ...defaultFormValues.options,
        ...currentFormValues.options,
      }
    };
    await onSubmit(completeFormValues);
  }, [setValue, getValues, onSubmit, qrFormData, qrGenerationState, setSelectedQRType, resetTyping, clearUrlValidation, resetGeneration]);

  const handleQRFormChange = useCallback((type: string, field: string, value: any) => {
    console.log('[QRGeneratorContainer] 🔄 handleQRFormChange triggered:', {
      type,
      field,
      value,
      hasUserStartedTyping,
      generationState,
      currentQrFormData: qrFormData[type]?.[field]
    });
    
    // Mark that user has started typing
    if (!hasUserStartedTyping && type === 'link' && field === 'url') {
      console.log('[QRGeneratorContainer] Setting hasUserStartedTyping to true');
      setHasUserStartedTyping(true);
      setGenerationTyping(value.toString());
    }
    
    if (postValidationTimeoutRef.current) {
      clearTimeout(postValidationTimeoutRef.current);
      postValidationTimeoutRef.current = null;
    }
    
    trackInput(value.toString());
    
    if (type === 'link' && value.toString().trim() !== '') {
      const currentState = generationState;
      if (currentState === 'IDLE' || currentState === 'COMPLETE' || currentState === 'ERROR' || currentState === 'READY_TO_GENERATE') {
        setGenerationTyping(value.toString());
        if (currentState === 'COMPLETE') {
          clearUrlValidation();
        }
      }
    }
    
    const newQRContent = updateQRFormData(type, field, value);
    
    // Handle empty values first
    if (!value || value.trim() === '' || (type === 'link' && value === 'https://tu-sitio-web.com')) {
      // Update the data field with the actual content (empty), not the default
      setValue('data', value || '', { shouldValidate: true });
      clearError();
      
      if (!isInitialMount) {
        clearContent();
      }
      
      if (type === 'link') {
        setRealTimeValidationError('Ingresa o pega el enlace de tu sitio web');
      } else {
        setRealTimeValidationError(null);
      }
      resetTyping();
      setUrlValidationState({
        isValidating: false,
        exists: null,
        shouldGenerateAnyway: false
      });
      lastValidatedUrl.current = '';
      clearUrlValidation();
      return;
    }
    
    // Continue processing non-empty values - THIS IS THE CRITICAL FIX
    console.log('[QRGeneratorContainer] Processing non-empty value:', value);
    
    // Validate in real-time without generating
    const updatedFormData = { ...qrFormData[selectedQRType], [field]: value };
    const validator = SmartValidators[selectedQRType as keyof typeof SmartValidators];
    
    if (validator) {
      const result = validator(updatedFormData);
      if (!result.isValid) {
        const errorMessage = result.message || '';
        setRealTimeValidationError(errorMessage === '' ? null : errorMessage);
        setUrlValidationState({
          isValidating: false,
          exists: null,
          shouldGenerateAnyway: false
        });
        if (type === 'link') {
          clearContent();
        } else {
          setValue('data', newQRContent, { shouldValidate: true });
        }
      } else {
        setRealTimeValidationError(null);
        
        if (type === 'link') {
          setUrlValidationState(prev => ({
            ...prev,
            isValidating: true,
            shouldGenerateAnyway: false
          }));
          setGenerationValidating();
          const cleanValue = value.trim();
          if (field === 'url' && cleanValue && cleanValue !== 'https://tu-sitio-web.com' && 
              !cleanValue.includes('"') && !cleanValue.includes("'") && !cleanValue.includes(';')) {
            validateUrl(cleanValue);
          }
        } else {
          // Update data field with the generated content
          setValue('data', newQRContent, { shouldValidate: true });
          // Only auto-generate for non-link types (link has validation)
          if (type !== 'link') {
            const currentFormValues = getValues();
            onSubmit(currentFormValues);
          }
        }
      }
    }
  }, [updateQRFormData, setValue, trackInput, qrFormData, selectedQRType, hasUserStartedTyping, validateUrl, setGenerationTyping, setGenerationValidating, generationState, getValues, clearError, clearContent, resetTyping, onSubmit, clearUrlValidation, isInitialMount]);

  // Delay configurable entre validación exitosa y generación de QR
  const POST_VALIDATION_DELAY = 800; // Reduced from 1500ms to 800ms for faster response
  
  // Callback para cuando la validación de URL se complete - EXACTO del original
  const handleUrlValidationComplete = useCallback((exists: boolean, error: string | null, validatedUrl?: string) => {
    const currentUrl = validatedUrl || (selectedQRType === 'link' ? qrFormData.link.url : getValues('data'));
    
    if (currentUrl === lastValidatedUrl.current) {
      return;
    }
    
    lastValidatedUrl.current = currentUrl;
    
    if (postValidationTimeoutRef.current) {
      clearTimeout(postValidationTimeoutRef.current);
      postValidationTimeoutRef.current = null;
    }
    
    setUrlValidationState(prev => ({
      ...prev,
      isValidating: false,
      exists: exists,
      shouldGenerateAnyway: false
    }));
    
    if (exists && !error && selectedType === 'qrcode' && selectedQRType === 'link') {
      const qrContent = currentUrl;
      setValue('data', qrContent, { shouldValidate: true });
      
      if (generationState === 'VALIDATING') {
        setGenerationReady();
      }
    } else if (!exists && selectedType === 'qrcode' && selectedQRType === 'link') {
      clearContent();
      
      if (generationState === 'VALIDATING') {
        setGenerationTyping('');
      }
    }
  }, [selectedType, selectedQRType, getValues, qrFormData, clearContent, setValue, generationState, setGenerationReady, setGenerationTyping]);

  const handleGenerateAnyway = useCallback(() => {
    setUrlValidationState(prev => ({
      ...prev,
      shouldGenerateAnyway: true,
      exists: true
    }));
    
    const currentUrl = qrFormData.link?.url || '';
    setValue('data', currentUrl, { shouldValidate: true });
    
    const currentFormValues = getValues();
    onSubmit(currentFormValues);
  }, [getValues, onSubmit, qrFormData, setValue]);

  const handleSmartQR = useCallback((smartConfig: any) => {
    // ⚠️ SMART QR INTEGRATION - CONFIGURACIÓN CRÍTICA
    // Este callback conecta el Smart QR con el generador principal
    const currentFormValues = getValues();
    const enhancedFormData = {
      ...currentFormValues,
      options: {
        ...currentFormValues.options,
        ...smartConfig
      }
    };
    
    // Usar la configuración de Smart QR para generar
    generateWithState(enhancedFormData, {
      isSmartQR: true,
      smartQRConfig: smartConfig
    });
  }, [getValues, generateWithState]);

  // Progress indicators - EXACTOS del original
  
  // Check if user has changed data in section 1 (barcode/QR data)
  const hasChangedData = (() => {
    if (selectedType === 'qrcode') {
      // For QR link type, check if URL changed from default
      if (selectedQRType === 'link') {
        return qrFormData.link.url !== 'https://tu-sitio-web.com' && qrFormData.link.url !== '';
      }
      // For other QR types, check if any field has non-empty value
      const formData = qrFormData[selectedQRType];
      if (formData) {
        return Object.values(formData).some(value => {
          if (typeof value === 'string') return value.trim() !== '';
          if (typeof value === 'boolean') return value !== false;
          return false;
        });
      }
    }
    // For non-QR codes, check if data changed from default
    return watchedData !== getDefaultDataForType(selectedType);
  })();
  
  // Check if user has changed options in section 2 (personalization options)
  const hasChangedOptions = (() => {
    if (!watchedOptions) return false;
    
    // Check each option against defaults
    const defaults = defaultFormValues.options;
    if (!defaults) return false;
    
    // Basic options
    if (watchedOptions.scale !== defaults.scale) return true;
    if (watchedOptions.fgcolor !== defaults.fgcolor) return true;
    if (watchedOptions.height !== defaults.height) return true;
    if (watchedOptions.includetext !== defaults.includetext) return true;
    if (watchedOptions.ecl !== defaults.ecl) return true;
    
    // Gradient options
    if (watchedOptions.gradient_enabled !== defaults.gradient_enabled) return true;
    if (watchedOptions.gradient_type !== defaults.gradient_type) return true;
    if (watchedOptions.gradient_color1 !== defaults.gradient_color1) return true;
    if (watchedOptions.gradient_color2 !== defaults.gradient_color2) return true;
    if (watchedOptions.gradient_direction !== defaults.gradient_direction) return true;
    if (watchedOptions.gradient_borders !== defaults.gradient_borders) return true;
    
    return false;
  })();
  
  // Progress indicators for GeneratorHeader
  const hasData = hasChangedData;
  const isPersonalized = hasChangedOptions;

  // EFECTOS CRÍTICOS - EXACTOS del original
  
  // Generate initial QR on mount - ONLY ONCE
  useEffect(() => {
    console.log('[Initial QR] useEffect triggered:', {
      hasGeneratedInitialQR: hasGeneratedInitialQR.current,
      isInitialMount,
      willGenerate: !hasGeneratedInitialQR.current && isInitialMount
    });
    
    // Remove the hasGeneratedInitialQR check to ensure it always runs on mount
    if (!isInitialMount && !shouldRefreshPlaceholder) {
      return;
    }
    
    // Only set this after successful generation
    console.log('[Initial QR] Generating initial QR code...');
    
    const generateInitialBarcode = async () => {
      // Get placeholder config from public API with retry logic
      let placeholderConfig = null;
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries && !placeholderConfig) {
        try {
          console.log(`[Initial QR] Fetching placeholder config from public API (attempt ${retryCount + 1}/${maxRetries})...`);
          // Add timestamp to prevent caching
          const response = await api.get(`/api/studio/public/placeholder?t=${Date.now()}`, false, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          console.log('[Initial QR] API response:', response);
          
          if (response.config?.config) {
            placeholderConfig = response.config.config;
            console.log('[Initial QR] Using public placeholder config:', {
              hasConfig: true,
              configDetails: JSON.stringify(placeholderConfig, null, 2),
              updatedAt: response.config.updatedAt,
              attempt: retryCount + 1
            });
            break; // Success, exit retry loop
          } else {
            console.log('[Initial QR] No placeholder config found in API response');
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait a bit before retrying to let StudioProvider load
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          console.log('[Initial QR] Failed to fetch public placeholder config:', error);
          retryCount++;
          if (retryCount < maxRetries) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (!placeholderConfig) {
        console.log('[Initial QR] All retry attempts failed, using default values');
      }
      
      // Default form data
      let initialFormData: GenerateFormData = {
        barcode_type: 'qrcode',
        data: 'https://tu-sitio-web.com',
        options: {
          scale: 4,
          fgcolor: '#000000',
          height: 100,
          includetext: true,
          ecl: 'M',
          gradient_enabled: true,
          gradient_type: 'radial',
          gradient_color1: '#2563EB',
          gradient_color2: '#000000',
          gradient_direction: 'top-bottom',
          gradient_borders: false, // Align with defaultFormValues
          // Use separated eye styles by default
          use_separated_eye_styles: true,
          eye_border_style: 'circle',
          eye_center_style: 'circle',
          data_pattern: 'dots',
          frame_enabled: false,
          frame_style: 'simple',
          frame_text: 'ESCANEA AQUÍ',
          frame_text_position: 'bottom'
        }
      };
      
      // If Studio placeholder config exists, merge it with defaults
      if (placeholderConfig) {
        console.log('[Initial QR] Using Studio placeholder config:', placeholderConfig);
        
        // Type assertion for template_data
        const config = placeholderConfig as any;
        initialFormData = {
          ...initialFormData,
          data: config.template_data?.url || initialFormData.data,
          options: {
            ...initialFormData.options,
            // Colors
            fgcolor: placeholderConfig.colors?.foreground || initialFormData.options.fgcolor,
            bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
            
            // Gradient
            gradient_enabled: placeholderConfig.gradient?.enabled ?? initialFormData.options.gradient_enabled,
            gradient_type: ['linear', 'radial'].includes(config.gradient?.gradient_type) ? config.gradient.gradient_type : initialFormData.options.gradient_type,
            gradient_color1: placeholderConfig.gradient?.colors?.[0] || initialFormData.options.gradient_color1,
            gradient_color2: placeholderConfig.gradient?.colors?.[1] || initialFormData.options.gradient_color2,
            
            // Eye styles
            use_separated_eye_styles: placeholderConfig.use_separated_eye_styles ?? initialFormData.options.use_separated_eye_styles,
            eye_shape: placeholderConfig.eye_shape,
            eye_border_style: placeholderConfig.eye_border_style || initialFormData.options.eye_border_style,
            eye_center_style: placeholderConfig.eye_center_style || initialFormData.options.eye_center_style,
            
            // Data pattern
            data_pattern: placeholderConfig.data_pattern || initialFormData.options.data_pattern,
            
            // Error correction
            ecl: placeholderConfig.error_correction || initialFormData.options.ecl,
            
            // Frame
            frame_enabled: placeholderConfig.frame?.frame_type ? true : false,
            frame_style: placeholderConfig.frame?.frame_type || initialFormData.options.frame_style,
            frame_text: placeholderConfig.frame?.text || initialFormData.options.frame_text,
            frame_text_position: placeholderConfig.frame?.text_position || initialFormData.options.frame_text_position
          }
        };
      }
      
      // Ensure options is defined
      initialFormData.options = initialFormData.options || {
        scale: 4,
        fgcolor: '#000000',
        height: 100,
        includetext: true,
        ecl: 'M',
        gradient_enabled: true,
        gradient_type: 'radial',
        gradient_color1: '#2563EB',
        gradient_color2: '#000000',
        gradient_direction: 'top-bottom',
        gradient_borders: false, // Align with defaultFormValues
        // Use separated eye styles by default
        use_separated_eye_styles: true,
        eye_border_style: 'circle',
        eye_center_style: 'circle',
        data_pattern: 'dots',
        frame_enabled: false,
        frame_style: 'simple',
        frame_text: 'ESCANEA AQUÍ',
        frame_text_position: 'bottom'
      };

      // Apply placeholder config if available
      if (placeholderConfig) {
        console.log('[Initial QR] Applying placeholder config to form data:', {
          placeholderConfig,
          before: { ...initialFormData.options }
        });
        
        // Colors
        initialFormData.options.fgcolor = placeholderConfig.colors?.foreground || initialFormData.options.fgcolor;
        initialFormData.options.bgcolor = placeholderConfig.colors?.background || initialFormData.options.bgcolor;
        
        // Gradient
        initialFormData.options.gradient_enabled = placeholderConfig.gradient?.enabled ?? initialFormData.options.gradient_enabled;
        initialFormData.options.gradient_type = ['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : initialFormData.options.gradient_type;
        initialFormData.options.gradient_color1 = placeholderConfig.gradient?.colors?.[0] || initialFormData.options.gradient_color1;
        initialFormData.options.gradient_color2 = placeholderConfig.gradient?.colors?.[1] || initialFormData.options.gradient_color2;
        initialFormData.options.gradient_apply_to_eyes = placeholderConfig.gradient?.apply_to_eyes ?? initialFormData.options.gradient_apply_to_eyes;
        initialFormData.options.gradient_per_module = placeholderConfig.gradient?.per_module ?? initialFormData.options.gradient_per_module;
        initialFormData.options.gradient_borders = placeholderConfig.gradient?.stroke_style?.enabled ?? initialFormData.options.gradient_borders;
        
        // Eye styles - Critical fix: properly apply separated eye styles from config
        initialFormData.options.use_separated_eye_styles = placeholderConfig.use_separated_eye_styles ?? initialFormData.options.use_separated_eye_styles;
        
        // If using separated eye styles, apply border and center styles
        if (placeholderConfig.use_separated_eye_styles || placeholderConfig.eye_border_style || placeholderConfig.eye_center_style) {
          initialFormData.options.use_separated_eye_styles = true;
          initialFormData.options.eye_border_style = placeholderConfig.eye_border_style || initialFormData.options.eye_border_style;
          initialFormData.options.eye_center_style = placeholderConfig.eye_center_style || initialFormData.options.eye_center_style;
          // Clear unified eye_shape when using separated styles
          initialFormData.options.eye_shape = undefined;
        } else if (placeholderConfig.eye_shape) {
          // If using unified eye shape
          initialFormData.options.use_separated_eye_styles = false;
          initialFormData.options.eye_shape = placeholderConfig.eye_shape;
        }
        
        // Data pattern
        initialFormData.options.data_pattern = placeholderConfig.data_pattern || initialFormData.options.data_pattern;
        
        // Error correction
        initialFormData.options.ecl = placeholderConfig.error_correction || initialFormData.options.ecl;
        
        // Frame
        initialFormData.options.frame_enabled = placeholderConfig.frame?.enabled ?? false;
        initialFormData.options.frame_style = placeholderConfig.frame?.style || initialFormData.options.frame_style;
        initialFormData.options.frame_text = placeholderConfig.frame?.text || initialFormData.options.frame_text;
        initialFormData.options.frame_text_position = placeholderConfig.frame?.text_position || initialFormData.options.frame_text_position;
        
        // Logo
        if (placeholderConfig.logo?.enabled && placeholderConfig.logo?.data) {
          initialFormData.options.logo_enabled = true;
          initialFormData.options.logo_data = placeholderConfig.logo.data;
          initialFormData.options.logo_size = placeholderConfig.logo.size_percentage || 20;
          initialFormData.options.logo_shape = placeholderConfig.logo.shape || 'square';
          initialFormData.options.logo_padding = placeholderConfig.logo.padding || 5;
        }
        
        // Effects
        if (placeholderConfig.effects && Array.isArray(placeholderConfig.effects)) {
          initialFormData.options.effects = placeholderConfig.effects.map((effect: any) => effect.type || effect);
        }
        
        // Eye colors - convert from backend format
        if (placeholderConfig.colors?.eye_colors || placeholderConfig.eye_colors) {
          const eyeColors = placeholderConfig.colors?.eye_colors || placeholderConfig.eye_colors;
          if (eyeColors.outer) {
            initialFormData.options.eye_border_color_mode = 'solid';
            initialFormData.options.eye_border_color_solid = eyeColors.outer;
          }
          if (eyeColors.inner) {
            initialFormData.options.eye_color_mode = 'solid';
            initialFormData.options.eye_color_solid = eyeColors.inner;
          }
        }
        
        // Also update the form values to ensure they're in sync
        setValue('options', initialFormData.options);
        
        console.log('[Initial QR] After applying placeholder config:', {
          after: { ...initialFormData.options },
          eye_styles: {
            use_separated: initialFormData.options.use_separated_eye_styles,
            border: initialFormData.options.eye_border_style,
            center: initialFormData.options.eye_center_style,
            unified: initialFormData.options.eye_shape
          }
        });
      }

      try {
        await generateWithState(initialFormData);
        console.log('[Initial QR] Initial generation completed');
        // Mark as generated only after successful generation
        hasGeneratedInitialQR.current = true;
      } catch (error) {
        console.error('[Initial QR] Initial generation failed:', error);
      } finally {
        setIsInitialMount(false);
      }
    };
    
    generateInitialBarcode();
  }, [generateWithState, isInitialMount, shouldRefreshPlaceholder]);

  // Detectar refresh de página y forzar recarga del placeholder
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Si la página viene del cache (back/forward) o es un refresh
      if (event.persisted || performance.navigation.type === 1) {
        console.log('[QRGeneratorContainer] Page refresh detected, forcing placeholder reload...');
        setShouldRefreshPlaceholder(prev => !prev); // Toggle para forzar useEffect
      }
    };

    // Detectar refresh inmediatamente al cargar
    if (performance.navigation.type === 1) {
      console.log('[QRGeneratorContainer] Initial page refresh detected');
      setTimeout(() => {
        setShouldRefreshPlaceholder(prev => !prev);
      }, 100); // Pequeño delay para asegurar que otros efectos se ejecuten primero
    }

    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []); // Solo ejecutar una vez al montar

  // Auto-generación para códigos que no son QR - USES CENTRALIZED GENERATION
  useEffect(() => {
    if (selectedType === 'qrcode') return;
    
    const isEmpty = !watchedData || watchedData.trim() === '';
    
    if (!isEmpty && !isInitialMount) {
      const currentFormValues = getValues();
      onSubmit(currentFormValues);
    }
  }, [watchedData, selectedType, getValues, onSubmit, isInitialMount]);

  // Monitor URL validation completion and update state machine only - EXACTO del original
  useEffect(() => {
    if (selectedType === 'qrcode' && 
        selectedQRType === 'link' && 
        !isValidatingUrl && 
        urlMetadata && 
        hasUserStartedTyping &&
        !isTyping &&
        generationState === 'VALIDATING') {
      // URL validation completed successfully
      // Don't generate here - let handleUrlValidationComplete handle it with delay
    }
  }, [isValidatingUrl, urlMetadata, selectedType, selectedQRType, hasUserStartedTyping, isTyping, generationState]);
  
  // Monitor URL validation errors - EXACTO del original
  useEffect(() => {
    if (selectedType === 'qrcode' && 
        selectedQRType === 'link' && 
        !isValidatingUrl && 
        urlValidationError && 
        generationState === 'VALIDATING') {
      // URL validation failed - reset to typing state
      setGenerationTyping('');
    }
  }, [isValidatingUrl, urlValidationError, selectedType, selectedQRType, generationState, setGenerationTyping]);

  // Auto-generación cuando cambian las opciones de personalización - EXACTO del original
  useEffect(() => {
    const isEmpty = !watchedData || watchedData.trim() === '';
    
    if (!isEmpty && !isInitialMount) {
      const currentFormValues = getValues();
      onSubmit(currentFormValues);
    }
  }, [watchedOptions, watchedData, getValues, onSubmit, isInitialMount]);

  // CRÍTICO: Effect to handle automatic generation when ready and not typing - USES CENTRALIZED GENERATION
  useEffect(() => {
    // Skip if already generating or completed
    if (generationState === 'GENERATING' || generationState === 'COMPLETE') {
      return;
    }
    
    if (generationState === 'READY_TO_GENERATE' && !isTyping && selectedQRType === 'link') {
      generationTimeoutRef.current = setTimeout(() => {
        // Double check state hasn't changed
        if (generationState === 'READY_TO_GENERATE' && !isTyping) {
          const currentFormValues = getValues();
          // For QR codes, generate content from current form data
          if (selectedType === 'qrcode') {
            const qrContent = qrGenerationState.generateQRContent(selectedQRType, qrFormData[selectedQRType]);
            const updatedFormValues = {
              ...currentFormValues,
              data: qrContent
            };
            onSubmit(updatedFormValues);
          } else {
            onSubmit(currentFormValues);
          }
        }
      }, POST_VALIDATION_DELAY);
      
      return () => {
        if (generationTimeoutRef.current) {
          clearTimeout(generationTimeoutRef.current);
          generationTimeoutRef.current = null;
        }
      };
    }
  }, [generationState, isTyping, selectedQRType, getValues, qrFormData, onSubmit]);

  // Cleanup para timeouts - EXACTO del original + generation timeout
  useEffect(() => {
    return () => {
      if (postValidationTimeoutRef.current) {
        clearTimeout(postValidationTimeoutRef.current);
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  // Effect to refresh placeholder config when window gets focus (user returns from studio)
  useEffect(() => {
    let isGenerating = false;
    
    const handleFocus = async () => {
      // Prevent infinite loops
      if (isGenerating || generationState === 'GENERATING') return;
      
      const currentValues = getValues();
      const currentFormData = { ...qrFormData, options: currentValues.options || {} };
      
      // Only refresh if we're showing the default QR (not user-generated)
      if (selectedType === 'qrcode' && 
          selectedQRType === 'link' && 
          qrFormData.link.url === 'https://tu-sitio-web.com' &&
          !hasUserStartedTyping) {
        
        isGenerating = true;
        
        console.log('[QRGeneratorContainer] Window focused, refreshing placeholder config...');
        
        try {
          const response = await api.get(`/api/studio/public/placeholder?t=${Date.now()}`, false, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          if (response.config?.config) {
            const placeholderConfig = response.config.config;
            console.log('[QRGeneratorContainer] Refreshed placeholder config:', {
              configDetails: JSON.stringify(placeholderConfig, null, 2)
            });
            
            // Re-generate with new config
            const updatedOptions = {
              ...currentFormData.options,
              // Colors
              fgcolor: placeholderConfig.colors?.foreground || currentFormData.options.fgcolor,
              bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
              
              // Gradient
              gradient_enabled: placeholderConfig.gradient?.enabled ?? currentFormData.options.gradient_enabled,
              gradient_type: ['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : currentFormData.options.gradient_type,
              gradient_color1: placeholderConfig.gradient?.colors?.[0] || currentFormData.options.gradient_color1,
              gradient_color2: placeholderConfig.gradient?.colors?.[1] || currentFormData.options.gradient_color2,
              gradient_apply_to_eyes: placeholderConfig.gradient?.apply_to_eyes ?? currentFormData.options.gradient_apply_to_eyes,
              gradient_per_module: placeholderConfig.gradient?.per_module ?? currentFormData.options.gradient_per_module,
              gradient_borders: placeholderConfig.gradient?.stroke_style?.enabled ?? currentFormData.options.gradient_borders,
              
              // Eye styles - Critical fix: properly apply separated eye styles from config
              use_separated_eye_styles: placeholderConfig.use_separated_eye_styles ?? currentFormData.options.use_separated_eye_styles,
              
              // Apply eye styles based on configuration
              ...(placeholderConfig.use_separated_eye_styles || placeholderConfig.eye_border_style || placeholderConfig.eye_center_style ? {
                use_separated_eye_styles: true,
                eye_border_style: placeholderConfig.eye_border_style || currentFormData.options.eye_border_style,
                eye_center_style: placeholderConfig.eye_center_style || currentFormData.options.eye_center_style,
                eye_shape: undefined
              } : placeholderConfig.eye_shape ? {
                use_separated_eye_styles: false,
                eye_shape: placeholderConfig.eye_shape
              } : {}),
              
              // Data pattern
              data_pattern: placeholderConfig.data_pattern || currentFormData.options.data_pattern,
              
              // Error correction
              ecl: placeholderConfig.error_correction || currentFormData.options.ecl,
              
              // Frame
              frame_enabled: placeholderConfig.frame?.enabled ?? false,
              frame_style: placeholderConfig.frame?.style || currentFormData.options.frame_style,
              frame_text: placeholderConfig.frame?.text || currentFormData.options.frame_text,
              frame_text_position: placeholderConfig.frame?.text_position || currentFormData.options.frame_text_position,
              
              // Logo
              ...(placeholderConfig.logo?.enabled && placeholderConfig.logo?.data ? {
                logo_enabled: true,
                logo_data: placeholderConfig.logo.data,
                logo_size: placeholderConfig.logo.size_percentage || 20,
                logo_shape: placeholderConfig.logo.shape || 'square',
                logo_padding: placeholderConfig.logo.padding || 5
              } : {}),
              
              // Effects
              ...(placeholderConfig.effects && Array.isArray(placeholderConfig.effects) ? {
                effects: placeholderConfig.effects.map((effect: any) => effect.type || effect)
              } : {}),
              
              // Eye colors - convert from backend format
              ...(placeholderConfig.colors?.eye_colors || placeholderConfig.eye_colors ? (() => {
                const eyeColors = placeholderConfig.colors?.eye_colors || placeholderConfig.eye_colors;
                const colorOptions: any = {};
                if (eyeColors.outer) {
                  colorOptions.eye_border_color_mode = 'solid';
                  colorOptions.eye_border_color_solid = eyeColors.outer;
                }
                if (eyeColors.inner) {
                  colorOptions.eye_color_mode = 'solid';
                  colorOptions.eye_color_solid = eyeColors.inner;
                }
                return colorOptions;
              })() : {})
            };
            
            console.log('[Window Focus] Updated options with placeholder config:', {
              eye_styles: {
                use_separated: updatedOptions.use_separated_eye_styles,
                border: updatedOptions.eye_border_style,
                center: updatedOptions.eye_center_style,
                unified: updatedOptions.eye_shape
              }
            });
            
            const updatedFormData = {
              ...currentFormData,
              options: updatedOptions
            };
            
            // Update form values
            setValue('options', updatedOptions);
            
            // Generate with new config (use current function reference)
            const { generateQR } = qrGenerationState;
            await generateQR(updatedFormData);
            console.log('[QRGeneratorContainer] Regenerated QR with refreshed placeholder config');
          }
        } catch (error) {
          console.error('[QRGeneratorContainer] Failed to refresh placeholder config:', error);
        } finally {
          isGenerating = false;
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    // Also check if we're navigating from studio
    const checkForStudioReturn = () => {
      const referrer = document.referrer;
      if (referrer.includes('/studio/placeholder')) {
        handleFocus();
      }
    };
    
    checkForStudioReturn();
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedType, selectedQRType, qrFormData.link.url, hasUserStartedTyping]);

  // Effect to listen for StudioProvider config changes and regenerate placeholder
  useEffect(() => {
    // ALWAYS log to confirm useEffect is running
    console.log('[QRGeneratorContainer] StudioProvider useEffect ALWAYS RUNS:', {
      configsLength: configs.length,
      timestamp: new Date().toISOString()
    });
    
    // Only proceed if configs are loaded
    if (configs.length === 0) {
      console.log('[QRGeneratorContainer] No configs yet, skipping...');
      return;
    }
    
    // Check if we should apply placeholder config
    const shouldApplyPlaceholder = selectedType === 'qrcode' && 
                                   selectedQRType === 'link' && 
                                   qrFormData.link.url === 'https://tu-sitio-web.com' &&
                                   !hasUserStartedTyping;
    
    console.log('[QRGeneratorContainer] Should apply placeholder:', shouldApplyPlaceholder, {
      selectedType,
      selectedQRType,
      url: qrFormData.link.url,
      hasUserStartedTyping
    });
    
    if (!shouldApplyPlaceholder) {
      return;
    }
    
    // Get config from StudioProvider context
    const studioPlaceholderConfig = getConfigByType('PLACEHOLDER');
    
    console.log('[QRGeneratorContainer] StudioProvider config check:', {
      hasConfig: !!studioPlaceholderConfig?.config,
      configType: studioPlaceholderConfig?.type
    });
    
    if (!studioPlaceholderConfig?.config) {
      console.log('[QRGeneratorContainer] No placeholder config found, skipping regeneration');
      return;
    }
    
    console.log('[QRGeneratorContainer] 🎯 APPLYING PLACEHOLDER CONFIG FROM STUDIOPROVIDER!');
    
    // Apply config immediately
    const currentValues = getValues();
    const currentFormData = { ...qrFormData, options: currentValues.options || {} };
    const placeholderConfig = studioPlaceholderConfig.config;
    
    const updatedOptions = {
      ...currentFormData.options,
      // Colors
      fgcolor: placeholderConfig.colors?.foreground || currentFormData.options.fgcolor,
      bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
      
      // Gradient
      gradient_enabled: placeholderConfig.gradient?.enabled ?? currentFormData.options.gradient_enabled,
      gradient_type: ['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : currentFormData.options.gradient_type,
      gradient_color1: placeholderConfig.gradient?.colors?.[0] || currentFormData.options.gradient_color1,
      gradient_color2: placeholderConfig.gradient?.colors?.[1] || currentFormData.options.gradient_color2,
      gradient_apply_to_eyes: placeholderConfig.gradient?.apply_to_eyes ?? currentFormData.options.gradient_apply_to_eyes,
      
      // Eye styles - CRITICAL mapping
      ...(placeholderConfig.use_separated_eye_styles || placeholderConfig.eye_border_style || placeholderConfig.eye_center_style ? {
        use_separated_eye_styles: true,
        eye_border_style: placeholderConfig.eye_border_style || 'square',
        eye_center_style: placeholderConfig.eye_center_style || 'square',
        eye_shape: undefined
      } : placeholderConfig.eye_shape ? {
        use_separated_eye_styles: false,
        eye_shape: placeholderConfig.eye_shape
      } : {}),
      
      // Data pattern
      data_pattern: placeholderConfig.data_pattern || currentFormData.options.data_pattern,
      
      // Error correction
      ecl: placeholderConfig.error_correction || currentFormData.options.ecl,
    };
    
    console.log('[QRGeneratorContainer] 🔥 FINAL CONFIG TO APPLY:', {
      eye_border_style: updatedOptions.eye_border_style,
      eye_center_style: updatedOptions.eye_center_style,
      use_separated_eye_styles: updatedOptions.use_separated_eye_styles
    });
    
    const updatedFormData = {
      ...currentFormData,
      options: updatedOptions
    };
    
    // Update form values immediately
    setValue('options', updatedOptions);
    
    // Generate with new config
    setTimeout(async () => {
      try {
        const { generateQR } = qrGenerationState;
        await generateQR(updatedFormData);
        console.log('[QRGeneratorContainer] ✅ Successfully regenerated QR with StudioProvider config');
      } catch (error) {
        console.error('[QRGeneratorContainer] ❌ Failed to regenerate QR:', error);
      }
    }, 50);
    
  }, [configs]);

  return (
    <GeneratorLayout>
      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 min-h-screen">
        {/* Barcode Type Tabs */}
        <BarcodeTypeTabs 
          selectedType={selectedType} 
          onTypeChange={handleTypeChange} 
        />

        <form onSubmit={handleSubmit(onSubmit)} className="scroll-smooth overflow-visible">
          {/* ⚠️ ESTRUCTURA DE FUSIÓN VISUAL - VALORES CRÍTICOS CALIBRADOS
              Este contenedor único crea el efecto de columnas fusionadas.
              
              COMPONENTES CLAVE:
              1. column-card: Contenedor único con transparencia 50% + blur
              2. GeneratorHeader: 100% ancho, empuja contenido hacia abajo
              3. Grid responsive: 1 columna móvil, 2 columnas desktop
              4. Preview sticky con superposición calibrada
              
              NO MODIFICAR sin sesión completa de recalibración.
          */}
          <div className="column-card p-0">
            {/* Progress Steps Bar - 100% width */}
            <div className="w-full px-6 pt-6 pb-2">
              <GeneratorHeader 
                currentStep={hasData ? (isPersonalized ? 3 : 2) : 1}
                hasData={hasData}
                isPersonalized={isPersonalized}
                className="p-0 bg-transparent border-0"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 lg:gap-[10px] generator-grid pl-0 pr-6 lg:pr-[10px] pb-6">
              {/* Columna de configuración - Original */}
              <section className="row-start-1 lg:col-start-1" id="form-content">
                <div className="h-full">
                <div className="space-y-3">
                  {/* Tarjeta 1: Datos - Se extiende hasta el borde izquierdo */}
                  <div className="-ml-0 lg:-ml-0">
                    <DataCard
                      className="rounded-l-none"
                    selectedType={selectedType}
                    selectedQRType={selectedQRType}
                    qrFormData={qrFormData}
                    isLoading={isLoading}
                    autoGenerationEnabled={autoGenerationEnabled}
                    realTimeValidationError={realTimeValidationError}
                    errors={errors}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    onQRTypeChange={handleQRTypeChange}
                    onQRFormChange={handleQRFormChange}
                    isValidatingUrl={isValidatingUrl}
                    urlMetadata={urlMetadata}
                    urlValidationError={urlValidationError}
                    urlValidationState={urlValidationState}
                    onUrlValidationComplete={handleUrlValidationComplete}
                    onGenerateAnyway={handleGenerateAnyway}
                    trackInput={trackInput}
                  />
                  </div>
                  
                  {/* Separador 3D */}
                  <div className="relative w-full my-4">
                    {/* Línea oscura superior */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-300/40 to-transparent dark:via-slate-700/40"></div>
                    {/* Línea clara inferior para efecto 3D */}
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10"></div>
                  </div>
                  
                  {/* Tarjeta 2: Opciones Avanzadas */}
                  <OptionsCard
                    control={control}
                    errors={errors}
                    watch={watch}
                    isLoading={isLoading}
                    selectedType={selectedType}
                    reset={reset}
                    setValue={setValue}
                    getValues={getValues}
                    onSubmit={debouncedOnSubmit}
                  />
                </div>
              </div>
            </section>


            {/* Columna de vista previa - ESTRUCTURA PROTEGIDA */}
            {/* ⚠️ IMPORTANTE: Esta estructura fue calibrada durante una sesión completa.
                NO MODIFICAR sin autorización explícita del usuario.
                
                VALORES CRÍTICOS CALIBRADOS:
                - mb-[-14px]: Margen negativo inferior del contenedor
                - mb-[-60px]: Superposición del PreviewSection
                - lg:sticky lg:top-0: Sticky solo en desktop, pegado al top
                - z-10/z-20: Capas para correcta superposición
                - lg:gap-[10px]: Espaciado entre columnas
                - lg:pr-[10px]: Padding derecho del grid
                - h-[14px]: Espaciador de alineación columna 1
                
                CONFIGURACIÓN DE FUSIÓN VISUAL:
                - Un único .column-card engloba ambas columnas
                - GeneratorHeader ocupa 100% del ancho superior
                - Grid de 2 columnas solo en lg (desktop)
                - Transparencia 50% con blur en globals.css
                
                Cualquier cambio romperá la alineación y fusión visual.
            */}
            <div className="row-start-2 lg:row-start-1 lg:col-start-2 w-fit mx-auto lg:mx-0 mb-[-14px] relative z-10">
              <section className={`${selectedType === 'qrcode' ? 'lg:sticky lg:top-0' : ''} w-fit p-0`}>
                <div className="mb-[-60px] relative z-20">
                  <PreviewSection
                  svgContent={svgContent || ''}
                  enhancedData={enhancedData}
                  isLoading={isLoading}
                  barcodeType={selectedType}
                  isUsingV3Enhanced={selectedType === 'qrcode'}
                  validationError={realTimeValidationError}
                  qrData={watchedData || ''}
                  urlGenerationState={generationState}
                  scannabilityAnalysis={scannabilityAnalysis}
                  transparentBackground={(() => {
                    const value = watch('options.transparent_background');
                    console.log('[QRGeneratorContainer] transparent_background value:', value);
                    return value;
                  })()}
                  backgroundColor={watch('options.bgcolor')}
                />
                </div>
                
                {/* Smart QR Button - Movido más abajo del QR */}
                {selectedType === 'qrcode' && qrFormData.link?.url && (
                  <div className="mt-16 px-4 pb-3">
                    <SmartQRButton 
                      url={qrFormData.link.url}
                      onGenerate={handleSmartQR}
                      className="w-full max-w-[320px] mx-auto"
                    />
                  </div>
                )}
              </section>
            </div>
          </div>
          </div>
        </form>
      </main>

      {/* Marketing Sections - Lazy Loaded */}
      <Suspense fallback={null}>
        <GeneratorMarketingZone />
      </Suspense>
    </GeneratorLayout>
  );
}