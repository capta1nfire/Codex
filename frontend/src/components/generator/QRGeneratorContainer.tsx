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

// Constantes del original
import { getDefaultDataForType } from '@/constants/barcodeTypes';

// Validación del original
import { SmartValidators } from '@/lib/smartValidation';

// Lazy load marketing components
const GeneratorMarketingZone = lazy(() => import('./marketing/GeneratorMarketingZone'));

export function QRGeneratorContainer() {
  // Get Studio context for placeholder config
  const { getConfigByType } = useStudio();
  
  // Estados principales - EXACTOS del original
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [realTimeValidationError, setRealTimeValidationError] = useState<string | null>(null);
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);
  const [autoGenerationEnabled] = useState(true); // Enable auto-generation by default
  
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
    if (hasGeneratedInitialQR.current || !isInitialMount) {
      return;
    }
    
    hasGeneratedInitialQR.current = true;
    console.log('[Initial QR] Generating initial QR code...');
    
    const generateInitialBarcode = async () => {
      // Get placeholder config from Studio
      const placeholderConfig = getConfigByType(StudioConfigType.PLACEHOLDER)?.config;
      
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
        initialFormData.options.gradient_type = ['linear', 'radial'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : initialFormData.options.gradient_type;
        initialFormData.options.gradient_color1 = placeholderConfig.gradient?.colors?.[0] || initialFormData.options.gradient_color1;
        initialFormData.options.gradient_color2 = placeholderConfig.gradient?.colors?.[1] || initialFormData.options.gradient_color2;
        initialFormData.options.use_separated_eye_styles = placeholderConfig.use_separated_eye_styles ?? initialFormData.options.use_separated_eye_styles;
        initialFormData.options.eye_shape = placeholderConfig.eye_shape;
        initialFormData.options.eye_border_style = placeholderConfig.eye_border_style || initialFormData.options.eye_border_style;
        initialFormData.options.eye_center_style = placeholderConfig.eye_center_style || initialFormData.options.eye_center_style;
        initialFormData.options.data_pattern = placeholderConfig.data_pattern || initialFormData.options.data_pattern;
        initialFormData.options.ecl = placeholderConfig.error_correction || initialFormData.options.ecl;
        initialFormData.options.frame_enabled = placeholderConfig.frame?.frame_type ? true : false;
        initialFormData.options.frame_style = placeholderConfig.frame?.frame_type || initialFormData.options.frame_style;
        initialFormData.options.frame_text = placeholderConfig.frame?.text || initialFormData.options.frame_text;
        initialFormData.options.frame_text_position = placeholderConfig.frame?.text_position || initialFormData.options.frame_text_position;
      }

      try {
        await generateWithState(initialFormData);
        console.log('[Initial QR] Initial generation completed');
      } catch (error) {
        console.error('[Initial QR] Initial generation failed:', error);
      } finally {
        setIsInitialMount(false);
      }
    };
    
    generateInitialBarcode();
  }, [generateWithState, getConfigByType, isInitialMount]);

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
            
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 lg:gap-[10px] generator-grid px-6 pr-6 lg:pr-[10px] pb-6">
              {/* Columna de configuración - Original */}
              <section className="row-start-1 lg:col-start-1" id="form-content">
                <div className="h-full">
                {/* Espaciador para alinear con el QR */}
                <div className="hidden lg:block h-[14px]"></div>
                
                <div className="space-y-6">
                  {/* Tarjeta 1: Datos */}
                  <DataCard
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
                  <div className="mt-16 px-4">
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