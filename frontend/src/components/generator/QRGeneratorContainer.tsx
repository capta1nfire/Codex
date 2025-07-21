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
import { mapStudioConfigToFormOptions } from '@/lib/studioConfigMapper';

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
    debounceMs: 500,
    onValidationComplete: (exists: boolean | null, error: any, url: string) => {
        if (postValidationTimeoutRef.current) {
            clearTimeout(postValidationTimeoutRef.current);
        }
        postValidationTimeoutRef.current = setTimeout(() => {
            const currentData = getValues('data');
            if (currentData === url) {
                setUrlValidationState({
                    isValidating: false,
                    exists: exists,
                    shouldGenerateAnyway: false
                });
                if (exists) {
                    setGenerationReady();
                }
            }
        }, 300);
    }
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
    const visualOptions = { ...formData.options };

    // 💡 Smart Hashing: Add a synthetic property to the hash if the gradient is linear.
    // This forces a re-generation when switching to/from a linear gradient,
    // making the 30%-70% proportion change visible without causing infinite loops.
    if (visualOptions.gradient_enabled && visualOptions.gradient_type === 'linear') {
      (visualOptions as any).linear_gradient_proportion = '60/40';
    }

    const optionsHash = JSON.stringify({
      ...visualOptions,
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
    
    // Pattern and style options
    if (watchedOptions.data_pattern !== defaults.data_pattern) return true;
    if (watchedOptions.eye_shape !== defaults.eye_shape) return true;
    if (watchedOptions.eye_border_style !== defaults.eye_border_style) return true;
    if (watchedOptions.eye_center_style !== defaults.eye_center_style) return true;
    
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
      // Evitar la generación inicial si ya hay una en curso o completada
      if (hasGeneratedInitialQR.current || generationState !== 'IDLE') {
        return;
      }
      
      console.log('[InitialMount] Generating initial QR code...');
      
      // Check if we should wait for StudioProvider configs to load
      // Si estamos en la página principal y no hay configs aún, esperar un poco
      const isOnMainPage = selectedType === 'qrcode' && 
                          selectedQRType === 'link' && 
                          qrFormData.link.url === 'https://tu-sitio-web.com' &&
                          !hasUserStartedTyping;
      
      if (isOnMainPage && configs.length === 0) {
        console.log('[InitialMount] No StudioProvider configs, continuing with public API...');
        // Don't wait indefinitely - continue with public API
        // return;  // REMOVED - don't block initial generation
      }
      
      // Obtener configuración del placeholder - DOBLE FUENTE: Studio Provider + API Pública
      let placeholderConfig = null;
      
      // Primero intentar desde StudioProvider (cuando estamos en Studio)
      try {
        const studioConfig = getConfigByType(StudioConfigType.PLACEHOLDER);
        if (studioConfig?.config) {
          placeholderConfig = studioConfig.config;
          console.log('[InitialMount] Using StudioProvider placeholder config:', placeholderConfig);
        }
      } catch (error) {
        console.log('[InitialMount] StudioProvider not available, trying public API...');
      }
      
      // Si no hay config del Studio, usar API pública (página principal)
      if (!placeholderConfig) {
        try {
          console.log('[InitialMount] Fetching placeholder config from public API...');
          const response = await api.get(`/api/studio/public/placeholder?t=${Date.now()}`, false, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          
          if (response.config?.config) {
            placeholderConfig = response.config.config;
            console.log('[InitialMount] Using public placeholder config:', {
              hasConfig: true,
              updatedAt: response.config.updatedAt,
              use_separated_eye_styles: placeholderConfig.use_separated_eye_styles
            });
          }
        } catch (error) {
          console.log('[InitialMount] Failed to fetch public placeholder config:', error);
        }
      }
      
      console.log('[InitialMount] Final placeholder config:', placeholderConfig);
      
      // Usar valores por defecto como base
      let initialFormData: GenerateFormData = {
        ...defaultFormValues
      };
      
      // Asegurarse de que `options` esté definido
      if (!initialFormData.options) {
        initialFormData.options = {};
      }

      // Si existe configuración de placeholder, aplicarla a los valores iniciales
      if (placeholderConfig) {
        console.log('[InitialMount] Applying placeholder config to initial form data...');
        console.log('[InitialMount] 🔥 DEBUG placeholderConfig:', placeholderConfig);
        
        // FIX: placeholderConfig ya ES el config, no necesita .config
        const formOptions = mapStudioConfigToFormOptions(placeholderConfig);
        console.log('[InitialMount] 🔥 DEBUG formOptions after mapping:', formOptions);
        console.log('[InitialMount] 📐 gradient_angle from mapping:', formOptions.gradient_angle);
        
        // Aplicar datos y opciones básicas del placeholder
        const templateData = (placeholderConfig as any)?.template_data;
        if (templateData?.data) {
          initialFormData.data = templateData.data;
        }

        initialFormData.options = {
          ...initialFormData.options,
          ...formOptions,
          // Asegurar que use_separated_eye_styles mantenga el valor por defecto si no viene del placeholder
          use_separated_eye_styles: formOptions.use_separated_eye_styles ?? initialFormData.options.use_separated_eye_styles ?? true,
        };
        
        console.log('[InitialMount] 🔥 DEBUG finalFormData.options:', initialFormData.options);
        console.log('[InitialMount] 📐 FINAL gradient_angle in options:', initialFormData.options.gradient_angle);
        console.log('[InitialMount] 🎯 FINAL use_separated_eye_styles:', initialFormData.options.use_separated_eye_styles);
      }
      
      // Aplicar los valores iniciales al formulario
      reset(initialFormData);
      
      // FORCE UPDATE: Asegurar que los valores se apliquen inmediatamente
      setValue('options', initialFormData.options, { shouldValidate: false, shouldDirty: false });
      
      // CRITICAL: Forzar use_separated_eye_styles a true si no está definido
      const currentSeparatedValue = getValues('options.use_separated_eye_styles');
      if (currentSeparatedValue === undefined || currentSeparatedValue === null) {
        console.log('[QRGeneratorContainer] Forcing use_separated_eye_styles to true');
        setValue('options.use_separated_eye_styles', true, { shouldValidate: false });
      }

      // Generar el código de barras inicial con los datos del formulario actualizados
      // Esto asegura que la primera visualización use la configuración del placeholder
      onSubmit({
        data: initialFormData.data,
        barcode_type: initialFormData.barcode_type,
        options: initialFormData.options,
      });
      
      hasGeneratedInitialQR.current = true;
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
            console.log('[QRGeneratorContainer] 📐 Placeholder gradient angle:', placeholderConfig.gradient?.angle);
            
            // Re-generate with new config
            const updatedOptions = {
              ...currentFormData.options,
              // Colors
              fgcolor: placeholderConfig.colors?.foreground || currentFormData.options.fgcolor,
              bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
              
              // Gradient - Studio/placeholder config takes priority over form data
              gradient_enabled: placeholderConfig.gradient?.enabled ?? currentFormData.options.gradient_enabled,
              gradient_type: (['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : currentFormData.options.gradient_type) || 'linear',
              gradient_color1: placeholderConfig.gradient?.colors?.[0] || currentFormData.options.gradient_color1,
              gradient_color2: placeholderConfig.gradient?.colors?.[1] || currentFormData.options.gradient_color2,
              gradient_angle: (() => {
                const angle = placeholderConfig.gradient?.angle ?? currentFormData.options.gradient_angle;
                console.log('[QRGeneratorContainer] 📐 Setting gradient_angle:', {
                  fromPlaceholder: placeholderConfig.gradient?.angle,
                  fromCurrentForm: currentFormData.options.gradient_angle,
                  finalValue: angle
                });
                return angle;
              })(),
              gradient_apply_to_eyes: placeholderConfig.gradient?.apply_to_eyes ?? currentFormData.options.gradient_apply_to_eyes,
              gradient_per_module: placeholderConfig.gradient?.per_module ?? currentFormData.options.gradient_per_module,
              gradient_borders: placeholderConfig.gradient?.stroke_style?.enabled ?? currentFormData.options.gradient_borders,
              
              // Eye styles - Critical fix: properly apply separated eye styles from config
              use_separated_eye_styles: placeholderConfig.use_separated_eye_styles ?? currentFormData.options.use_separated_eye_styles ?? true,
              
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
            
            // CRITICAL: Ensure use_separated_eye_styles is true if not defined
            if (updatedOptions.use_separated_eye_styles === undefined || updatedOptions.use_separated_eye_styles === null) {
              console.log('[Window Focus] Forcing use_separated_eye_styles to true');
              setValue('options.use_separated_eye_styles', true, { shouldValidate: false });
            }
            
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
    
    // Apply config immediately and synchronously update the form
    const currentValues = getValues();
    const currentFormData = { ...qrFormData, options: currentValues.options || {} };
    const placeholderConfig = studioPlaceholderConfig.config;
    
    const updatedOptions = {
      ...currentFormData.options,
      // Colors
      fgcolor: placeholderConfig.colors?.foreground || currentFormData.options.fgcolor,
      bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
      
      // Gradient - Studio/placeholder config takes priority over form data
      gradient_enabled: placeholderConfig.gradient?.enabled ?? currentFormData.options.gradient_enabled,
      gradient_type: (['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : currentFormData.options.gradient_type) || 'linear',
      gradient_color1: placeholderConfig.gradient?.colors?.[0] || currentFormData.options.gradient_color1,
      gradient_color2: placeholderConfig.gradient?.colors?.[1] || currentFormData.options.gradient_color2,
      gradient_angle: (() => {
        const angle = placeholderConfig.gradient?.angle ?? currentFormData.options.gradient_angle;
        console.log('[QRGeneratorContainer STUDIOPROVIDER] 📐 Setting gradient_angle:', {
          fromPlaceholder: placeholderConfig.gradient?.angle,
          fromCurrentForm: currentFormData.options.gradient_angle,
          finalValue: angle
        });
        return angle;
      })(),
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
    
    // Update form values synchronously first
    setValue('options', updatedOptions, { shouldValidate: false, shouldDirty: false });
    
    // Force form to re-render with new values before generation
    setTimeout(async () => {
      try {
        console.log('[QRGeneratorContainer] 🚀 Regenerating QR with StudioProvider config...');
        const { generateQR } = qrGenerationState;
        await generateQR(updatedFormData);
        console.log('[QRGeneratorContainer] ✅ Successfully regenerated QR with StudioProvider config');
      } catch (error) {
        console.error('[QRGeneratorContainer] ❌ Failed to regenerate QR:', error);
      }
    }, 100); // Increased delay to ensure form updates first
    
  }, [configs]);

  // Controlar el estado de los ojos separados
  useEffect(() => {
    if (watchedOptions) {
      const newOptions = { ...watchedOptions };
      
      const isUsingSeparatedStyles = 
        newOptions.eye_border_style !== 'circle' || 
        newOptions.eye_center_style !== 'circle';

      // Prevenir bucles de actualización
      if (isUsingSeparatedStyles !== newOptions.use_separated_eye_styles) {
        setValue('options.use_separated_eye_styles', isUsingSeparatedStyles);
      }
    }
  }, [watchedOptions?.eye_border_style, watchedOptions?.eye_center_style, setValue, watchedOptions]);

  // Logica para auto-generar QR cuando los datos o opciones cambian
  useEffect(() => {
    if (selectedType === 'qrcode') return;
    
    const isEmpty = !watchedData || watchedData.trim() === '';
    
    if (!isEmpty && !isInitialMount) {
      const currentFormValues = getValues();
      onSubmit(currentFormValues);
    }
  }, [watchedData, selectedType, getValues, onSubmit, isInitialMount]);

  // Regenerar QR cuando cambian opciones importantes de diseño
  useEffect(() => {
    console.log('[QRGeneratorContainer] Design options useEffect triggered:', {
      selectedType,
      isInitialMount,
      hasData: !!watchedData,
      dataLength: watchedData?.length,
      hasChangedOptions,
      data_pattern: watchedOptions?.data_pattern,
      eye_border_style: watchedOptions?.eye_border_style,
      eye_center_style: watchedOptions?.eye_center_style
    });
    
    // Solo para QR codes y después del mount inicial
    if (selectedType !== 'qrcode' || isInitialMount) {
      console.log('[QRGeneratorContainer] Skipping regeneration:', {
        reason: selectedType !== 'qrcode' ? 'Not QR code' : 'Initial mount'
      });
      return;
    }
    
    // Solo regenerar si hay datos
    if (!watchedData || watchedData.trim() === '') {
      console.log('[QRGeneratorContainer] Skipping regeneration: No data');
      return;
    }
    
    // Solo regenerar si el usuario ha interactuado con las opciones
    if (!hasChangedOptions) {
      console.log('[QRGeneratorContainer] Skipping regeneration: No options changed');
      return;
    }
    
    console.log('[QRGeneratorContainer] 🎯 Design option changed, regenerating QR...');
    const currentFormValues = getValues();
    console.log('[QRGeneratorContainer] Form values for regeneration:', {
      data_pattern: currentFormValues.options?.data_pattern,
      gradient_enabled: currentFormValues.options?.gradient_enabled,
      eye_styles: {
        eye_border_style: currentFormValues.options?.eye_border_style,
        eye_center_style: currentFormValues.options?.eye_center_style,
        use_separated: currentFormValues.options?.use_separated_eye_styles
      }
    });
    onSubmit(currentFormValues);
  }, [
    watchedOptions?.data_pattern,
    watchedOptions?.eye_shape,
    watchedOptions?.eye_border_style, 
    watchedOptions?.eye_center_style,
    watchedOptions?.gradient_enabled,
    watchedOptions?.gradient_type,
    watchedOptions?.gradient_color1,
    watchedOptions?.gradient_color2,
    watchedOptions?.gradient_angle,
    watchedOptions?.gradient_per_module,
    watchedOptions?.fgcolor,
    watchedOptions?.bgcolor,
    selectedType,
    isInitialMount,
    hasChangedOptions,
    watchedData
  ]);

  // Handle StudioProvider config changes - RESTAURADO CON DOBLE FUENTE
  useEffect(() => {
    // Solo aplicar si estamos en contexto de Studio (configs disponible)
    if (!configs || !configs.PLACEHOLDER) {
      return;
    }

    console.log('[QRGeneratorContainer] 🎯 Studio config changed, applying placeholder config...');
    
    setTimeout(async () => {
      try {
        const placeholderConfig = configs.PLACEHOLDER;
        const currentFormData = getValues();
        
        // Apply Studio/placeholder config with priority over form data
        const updatedOptions = {
          ...currentFormData.options,
          // Colors
          fgcolor: placeholderConfig.colors?.foreground || currentFormData.options.fgcolor,
          bgcolor: placeholderConfig.colors?.background || '#FFFFFF',
          
          // Gradient - Studio/placeholder config takes priority over form data
          gradient_enabled: placeholderConfig.gradient?.enabled ?? currentFormData.options.gradient_enabled,
          gradient_type: (['linear', 'radial', 'conic', 'diamond', 'spiral'].includes(placeholderConfig.gradient?.gradient_type) ? placeholderConfig.gradient.gradient_type : currentFormData.options.gradient_type) || 'linear',
          gradient_color1: placeholderConfig.gradient?.colors?.[0] || currentFormData.options.gradient_color1,
          gradient_color2: placeholderConfig.gradient?.colors?.[1] || currentFormData.options.gradient_color2,
          gradient_angle: (() => {
            const angle = placeholderConfig.gradient?.angle ?? currentFormData.options.gradient_angle;
            console.log('[QRGeneratorContainer useEffect SYNC] 📐 Setting gradient_angle:', {
              fromPlaceholder: placeholderConfig.gradient?.angle,
              fromCurrentForm: currentFormData.options.gradient_angle,
              finalValue: angle
            });
            return angle;
          })(),
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
          } : {})
        };
        
        const updatedFormData = {
          ...currentFormData,
          options: updatedOptions
        };
        
        // Update form values immediately
        setValue('options', updatedOptions);
        
        // Generate with new config
        await generateWithState(updatedFormData);
        console.log('[QRGeneratorContainer] ✅ Successfully regenerated QR with StudioProvider config');
      } catch (error) {
        console.error('[QRGeneratorContainer] ❌ Failed to regenerate QR:', error);
      }
    }, 50);
    
  }, [configs, getValues, setValue, generateWithState]);

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
                  <div className="relative px-6 my-4">
                    {/* Línea oscura superior */}
                    <div className="h-[1px] w-full bg-slate-300/40 dark:bg-slate-700/40"></div>
                    {/* Línea clara inferior para efecto 3D */}
                    <div className="h-[1px] w-full bg-white/50 dark:bg-white/10"></div>
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