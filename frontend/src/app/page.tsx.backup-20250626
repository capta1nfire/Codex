/**
 * Main QR/Barcode Generator Page
 * 
 * Features:
 * - QR Engine v2 with high performance generation
 * - Smart auto-generation with debouncing
 * - Progressive validation with helpful messages
 * - Initial QR display with default URL
 * - Smooth placeholder transitions while typing
 * 
 * Updated: June 16, 2025
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { QrCode, Check, Zap, Database, Sparkles } from 'lucide-react';
import GenerationOptions from '@/components/generator/GenerationOptions';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Hooks personalizados
// useQRContentGeneration is now integrated into useQRGenerationState
import { useBarcodeTypes } from '@/hooks/useBarcodeTypes';
import { useSmartAutoGeneration } from '@/hooks/useSmartAutoGeneration';
import { useQRGenerationState } from '@/hooks/useQRGenerationState';

// Componentes modulares
import { BarcodeTypeTabs } from '@/components/generator/BarcodeTypeTabs';
import { QRContentSelector } from '@/components/generator/QRContentSelector';
import { QRForm } from '@/components/generator/QRForms';
import { SmartQRButton } from '@/features/smart-qr/components';
import { PreviewSection } from '@/components/generator/PreviewSectionV3';
import { useTypingTracker } from '@/hooks/useTypingTracker';

// Constantes
import { getDefaultDataForType } from '@/constants/barcodeTypes';
import { defaultFormValues } from '@/constants/defaultFormValues';

// Validación
import { SmartValidators } from '@/lib/smartValidation';
import { useUrlValidation } from '@/hooks/useUrlValidation';

export default function Home() {
  // Estados principales
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [realTimeValidationError, setRealTimeValidationError] = useState<string | null>(null);
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);
  
  // Estados para validación de existencia de URL
  const [urlValidationState, setUrlValidationState] = useState<{
    isValidating: boolean;
    exists: boolean | null;
    shouldGenerateAnyway: boolean;
  }>({
    isValidating: false,
    exists: null,
    shouldGenerateAnyway: false
  });
  
  // Ref para trackear la última validación procesada
  // CRITICAL: This ref prevents infinite loops by ensuring we don't process
  // the same URL validation multiple times. Without this, the component would
  // re-validate the same URL endlessly causing "Maximum update depth exceeded"
  const lastValidatedUrl = useRef<string>('');
  
  // Ref to prevent double initial generation in StrictMode
  const hasGeneratedInitialQR = useRef(false);
  
  // Ref to track last generated data to prevent duplicates
  const lastGeneratedData = useRef<string>('');

  // Import centralized state management hook
  const qrGenerationState = useQRGenerationState();
  
  // Use centralized state instead of individual hooks
  const { 
    state: generationState,
    enhancedData,
    svgContent,
    isLoading,
    error: generationError,
    generateQR: generateWithState,
    setTyping: setGenerationTyping,
    setValidating: setGenerationValidating,
    setReadyToGenerate: setGenerationReady,
    reset: resetGeneration
  } = qrGenerationState;
  
  // URL validation hook lifted to page level to coordinate with auto-generation
  const { 
    isValidating: isValidatingUrl, 
    metadata: urlMetadata, 
    error: urlValidationError, 
    validateUrl,
    clearValidation: clearUrlValidation
  } = useUrlValidation({
    enabled: true,
    debounceMs: 800
  });
  

  
  // Typing tracker for sophisticated placeholder system
  const { isTyping, trackInput, resetTyping } = useTypingTracker({
    typingDebounceMs: 150,
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
          // Non-URL QR types can generate immediately
          validateAndGenerate(currentFormValues, selectedQRType, currentQRData);
        }
      }
    }
  });
  
  // QR Content generation state
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
  
  const updateQRFormData = useCallback((type: string, field: string, value: any) => {
    setQrFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    
    const updatedData = {
      ...qrFormData[type],
      [field]: value
    };
    
    return qrGenerationState.generateQRContent(type, updatedData);
  }, [qrFormData, qrGenerationState]);

  // Hook de auto-generación inteligente
  const autoGenerationEnabled = true; // Feature flag for auto-generation
  
  const {
    validateAndGenerate,
    validationError
  } = useSmartAutoGeneration({
    enabled: autoGenerationEnabled,
    onGenerationStart: () => {
      // Don't clear URL validation for links - we want to keep the metadata (favicon)
      // Only clear for other QR types
      if (selectedType === 'qrcode' && selectedQRType !== 'link') {
        // Clear validation for non-link types if needed
      }
    },
    onGenerate: (formData: GenerateFormData) => {
      onSubmit(formData);
    }
  });

  // react-hook-form
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

  // Observar valores del formulario
  const selectedType = watch('barcode_type');
  const watchedData = watch('data');
  const watchedOptions = watch('options');

  // Unified states for UI (now using centralized state)
  const serverError = generationError;
  const clearError = () => resetGeneration();
  const clearContent = () => resetGeneration();

  // Log server error only if it's not an auth error
  if (serverError && serverError !== 'Authentication required for v3 API') {
    console.error('Server error:', serverError);
  }

  // Handlers
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    // Prevent duplicate generation for same data
    if (lastGeneratedData.current === formData.data && generationState === 'COMPLETE') {
      console.log('[onSubmit] Skipping duplicate generation for same data:', formData.data);
      return;
    }
    
    // Use centralized state management for generation
    lastGeneratedData.current = formData.data;
    await generateWithState(formData);
    
    // Play success sound on QR generation
    if (selectedType === 'qrcode' && typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQYGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fDTgjMGHm7A7+OZURE');
        audio.volume = 0.1;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, [generateWithState, selectedType, generationState]);

  const handleTypeChange = useCallback(async (newType: string) => {
    // Reset typing state when changing types
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
    
    // Cancel any pending post-validation timeout
    if (postValidationTimeoutRef.current) {
      clearTimeout(postValidationTimeoutRef.current);
      postValidationTimeoutRef.current = null;
    }
    
    // Reset typing state when changing QR types
    if (newQRType === 'link') {
      setHasUserStartedTyping(false);
      clearUrlValidation(); // Clear any pending URL validation
      resetGeneration(); // Reset centralized state machine
      // Also reset URL validation state
      setUrlValidationState({
        isValidating: false,
        exists: null,
        shouldGenerateAnyway: false
      });
    } else {
      // Clear URL validation when switching away from link
      clearUrlValidation();
      resetGeneration(); // Reset centralized state machine
    }
    resetTyping();
    
    // Reset validation tracking
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
    
    // Mark that user has started typing
    if (!hasUserStartedTyping && type === 'link' && field === 'url') {
      setHasUserStartedTyping(true);
      setGenerationTyping(value.toString()); // Update centralized state machine with data
    }
    
    // Cancel any pending post-validation timeout when user types again
    if (postValidationTimeoutRef.current) {
      clearTimeout(postValidationTimeoutRef.current);
      postValidationTimeoutRef.current = null;
    }
    
    // Track typing for UI feedback
    trackInput(value.toString());
    
    // Update state machine when user starts typing
    if (type === 'link' && value.toString().trim() !== '') {
      // Only transition to typing if we're in a state that allows it
      const currentState = generationState;
      if (currentState === 'IDLE' || currentState === 'COMPLETE' || currentState === 'ERROR' || currentState === 'READY_TO_GENERATE') {
        setGenerationTyping(value.toString());
        // Clear previous validation metadata when starting to type a new URL
        if (currentState === 'COMPLETE') {
          clearUrlValidation();
        }
      }
    }
    
    // Update QR form data locally (but not the main form data yet for links)
    const newQRContent = updateQRFormData(type, field, value);
    
    // Si el campo está vacío o tiene el valor por defecto, limpiar el código generado
    if (!value || value.trim() === '' || (type === 'link' && value === 'https://tu-sitio-web.com')) {
      setValue('data', newQRContent, { shouldValidate: true });
      clearError();
      
      // Don't clear content on initial mount to preserve the initial QR code
      if (!isInitialMount) {
        clearContent();
      }
      
      // For link type, show the initial blue message when empty or default
      if (type === 'link') {
        setRealTimeValidationError('Ingresa o pega el enlace de tu sitio web');
      } else {
        setRealTimeValidationError(null);
      }
      resetTyping(); // Reset typing state when field is empty
      // Reset URL validation state
      setUrlValidationState({
        isValidating: false,
        exists: null,
        shouldGenerateAnyway: false
      });
      // Reset last validated URL to allow re-validation
      lastValidatedUrl.current = '';
      // Clear URL validation metadata
      clearUrlValidation();
      return;
    }
    
    // Validate in real-time without generating
    const updatedFormData = { ...qrFormData[selectedQRType], [field]: value };
    const validator = SmartValidators[selectedQRType as keyof typeof SmartValidators];
    
    
    if (validator) {
      const result = validator(updatedFormData);
      if (!result.isValid) {
        // Only show error if there's a message (not empty string)
        const errorMessage = result.message || '';
        setRealTimeValidationError(errorMessage === '' ? null : errorMessage);
        // Reset URL validation state on invalid format
        setUrlValidationState({
          isValidating: false,
          exists: null,
          shouldGenerateAnyway: false
        });
        // Clear content for invalid URLs
        if (type === 'link') {
          clearContent();
        } else {
          setValue('data', newQRContent, { shouldValidate: true });
        }
      } else {
        setRealTimeValidationError(null);
        
        // CRITICAL: For link type, mark as validating but don't update data or generate yet
        // This was the KEY FIX - previously we were updating 'data' here which
        // triggered QR generation via useEffect before validation completed
        if (type === 'link') {
          setUrlValidationState(prev => ({
            ...prev,
            isValidating: true,
            shouldGenerateAnyway: false
          }));
          setGenerationValidating(); // Update centralized state to validating
          // Trigger URL validation for link type
          // Only validate clean URLs without quotes or special characters
          const cleanValue = value.trim();
          if (field === 'url' && cleanValue && cleanValue !== 'https://tu-sitio-web.com' && 
              !cleanValue.includes('"') && !cleanValue.includes("'") && !cleanValue.includes(';')) {
            validateUrl(cleanValue);
          }
          // Don't update 'data' field yet - wait for URL validation to complete
          // The 'data' field will be updated in handleUrlValidationComplete instead
        } else {
          // For non-link QR types, update data and generate immediately
          setValue('data', newQRContent, { shouldValidate: true });
          const currentFormValues = getValues();
          validateAndGenerate(currentFormValues, selectedQRType, updatedFormData);
        }
      }
    }
  }, [updateQRFormData, setValue, trackInput, qrFormData, selectedQRType, hasUserStartedTyping, validateUrl, setGenerationTyping, setGenerationValidating, generationState, getValues, clearError, clearContent, resetTyping, validateAndGenerate, clearUrlValidation, isInitialMount]);

  // Ref para el timeout de generación post-validación
  const postValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Delay configurable entre validación exitosa y generación de QR (en ms)
  const POST_VALIDATION_DELAY = 1000; // 1 segundo de delay después de validar
  
  // TIMING FLOW para URLs (Critical for proper UX):
  // 1. Usuario escribe URL
  // 2. Espera 800ms (debounce de validación en useUrlValidation)
  // 3. Se ejecuta validación de existencia de URL via /api/validate/check-url
  // 4. Si existe: espera POST_VALIDATION_DELAY (1000ms)
  // 5. Se genera el código QR
  // Total: ~1.8-2 segundos desde que el usuario termina de escribir
  //
  // IMPORTANT: This delay prevents jarring immediate generation and gives
  // users time to see validation result before QR appears
  
  // Callback para cuando la validación de URL se complete
  const handleUrlValidationComplete = useCallback((exists: boolean, error: string | null, validatedUrl?: string) => {
    // Use the URL passed from LinkForm to ensure we have the correct value
    const currentUrl = validatedUrl || (selectedQRType === 'link' ? qrFormData.link.url : getValues('data'));
    
    // Evitar procesar la misma URL múltiples veces
    if (currentUrl === lastValidatedUrl.current) {
      return;
    }
    
    lastValidatedUrl.current = currentUrl;
    
    // Cancelar cualquier timeout pendiente
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
    
    // Solo generar automáticamente si el sitio existe y el usuario quiere generación automática
    if (exists && !error && selectedType === 'qrcode' && selectedQRType === 'link') {
      // Use the validated URL directly to ensure we have the correct value
      const qrContent = currentUrl; // For link type, the content is just the URL
      setValue('data', qrContent, { shouldValidate: true });
      
      
      // Update centralized state machine to show we're ready to generate
      // Only update if we're in VALIDATING state to avoid duplicate transitions
      if (generationState === 'VALIDATING') {
        setGenerationReady();
      }
      
      // The effect above will handle the actual generation when state is READY_TO_GENERATE and user not typing
      
    } else if (!exists && selectedType === 'qrcode' && selectedQRType === 'link') {
      // No generar automáticamente si el sitio no existe
      clearContent(); // Limpiar cualquier código existente
      
      // Update centralized state machine to show validation error
      // Reset to typing state since validation failed
      if (generationState === 'VALIDATING') {
        setGenerationTyping('');
      }
    }
  }, [selectedType, selectedQRType, getValues, qrFormData, clearContent, setValue, generationState, setGenerationReady, setGenerationTyping]);

  // Función para generar de todas formas cuando el sitio no existe
  const handleGenerateAnyway = useCallback(() => {
    setUrlValidationState(prev => ({
      ...prev,
      shouldGenerateAnyway: true,
      exists: true // Marcar temporalmente como existente para permitir generación
    }));
    
    // Update the data field with QR content before generating
    // Get the current URL directly from the form data
    const currentUrl = qrFormData.link?.url || '';
    setValue('data', currentUrl, { shouldValidate: true });
    
    const currentFormValues = getValues();
    
    // Llamar directamente a onSubmit para evitar validación
    onSubmit(currentFormValues);
  }, [getValues, onSubmit, qrFormData, setValue]);

  // Generate initial QR on mount with default values - ONLY ONCE
  useEffect(() => {
    // Skip if already generated or not initial mount
    if (hasGeneratedInitialQR.current || !isInitialMount) {
      return;
    }
    
    hasGeneratedInitialQR.current = true;
    console.log('[Initial QR] Generating initial QR code...');
    
    const generateInitialBarcode = async () => {
      const initialFormData: GenerateFormData = {
        barcode_type: 'qrcode',
        data: 'https://tu-sitio-web.com',
        options: {
          scale: 4,
          fgcolor: '#000000',
          bgcolor: undefined,
          height: 100,
          includetext: true,
          ecl: 'M',
          gradient_enabled: true,
          gradient_type: 'radial',
          gradient_color1: '#2563EB',
          gradient_color2: '#000000',
          gradient_direction: 'top-bottom',
          gradient_borders: true,
        }
      };
      
      try {
        await generateWithState(initialFormData);
        console.log('[Initial QR] Initial generation completed');
      } catch (error) {
        console.error('[Initial QR] Initial generation failed:', error);
      } finally {
        setIsInitialMount(false);
      }
    };
    
    // Generate immediately
    generateInitialBarcode();
  }, []); // Empty deps - only run once on mount

  // Monitor SVG content changes for debugging
  useEffect(() => {
    console.log('[SVG Monitor] SVG content changed:', {
      hasContent: !!svgContent,
      length: svgContent?.length,
      firstChars: svgContent?.substring(0, 50)
    });
  }, [svgContent]);

  // Auto-generación para códigos que no son QR (los QR se manejan en handleQRFormChange)
  useEffect(() => {
    // Skip if it's a QR code (handled separately)
    if (selectedType === 'qrcode') return;
    
    // No generar si está vacío o es el mount inicial
    const isEmpty = !watchedData || watchedData.trim() === '';
    
    if (!isEmpty && !isInitialMount) {
      const currentFormValues = getValues();
      validateAndGenerate(currentFormValues);
    }
  }, [watchedData, selectedType, getValues, validateAndGenerate, isInitialMount]);
  
  // Monitor URL validation completion and update state machine only
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
      // This prevents duplicate generation
    }
  }, [isValidatingUrl, urlMetadata, selectedType, selectedQRType, hasUserStartedTyping, isTyping, generationState]);
  
  // Monitor URL validation errors
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
  
  // Auto-generación cuando cambian las opciones de personalización
  useEffect(() => {
    // No generar si está vacío
    const isEmpty = !watchedData || watchedData.trim() === '';
    
    // Solo ejecutar si hay datos válidos y no es el mount inicial
    if (!isEmpty && !isInitialMount) {
      const currentFormValues = getValues();
      // Usar onSubmit directamente para respuesta inmediata en opciones
      onSubmit(currentFormValues);
    }
  }, [watchedOptions]); // Solo dependencias esenciales para evitar loops

  // Cerrar dropdown al hacer clic fuera
  const { setIsDropdownOpen } = useBarcodeTypes();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsDropdownOpen]);

  // Cleanup para el timeout de post-validación
  useEffect(() => {
    return () => {
      if (postValidationTimeoutRef.current) {
        clearTimeout(postValidationTimeoutRef.current);
      }
    };
  }, []);

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
    if (watchedOptions.bgcolor !== defaults.bgcolor) return true;
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
  
  // Step 1 is active when data changes
  const hasSelectedType = hasChangedData;
  
  // Step 2 is active only when options change
  const isPersonalized = hasChangedOptions;

  // Effect to handle automatic generation when ready and not typing
  useEffect(() => {
    // Skip if already generating or completed
    if (generationState === 'GENERATING' || generationState === 'COMPLETE') {
      return;
    }
    
    if (generationState === 'READY_TO_GENERATE' && !isTyping && selectedQRType === 'link') {
      const timeoutId = setTimeout(() => {
        // Double check state hasn't changed
        if (generationState === 'READY_TO_GENERATE' && !isTyping) {
          const currentFormValues = getValues();
          const updatedFormData = qrFormData.link;
          validateAndGenerate(currentFormValues, selectedQRType, updatedFormData);
        }
      }, POST_VALIDATION_DELAY);
      
      return () => clearTimeout(timeoutId);
    }
  }, [generationState, isTyping, selectedQRType, getValues, qrFormData, validateAndGenerate]);

  return (
    <div className="min-h-screen">
      {/* Fixed animated gradient background - stays in place during scroll */}
      <div className="fixed inset-0 -z-10">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="fixed inset-0">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl animate-blob"></div>
          <div className="absolute -top-[20%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-purple-200/30 to-pink-200/30 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-[40%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Tabs de tipos de código */}
        <BarcodeTypeTabs 
          selectedType={selectedType} 
          onTypeChange={handleTypeChange} 
        />

        <form onSubmit={handleSubmit(onSubmit)} className="scroll-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 generator-grid">
            {/* Columna de configuración */}
            <section className="lg:col-span-2" id="form-content">
              <Card className="hero-card border-2 border-corporate-blue-200/20 shadow-corporate-lg backdrop-blur-xl bg-white/40 dark:bg-slate-950/40 h-full">
                {/* Progress Steps Bar */}
                <div className="px-6 pt-3 pb-2">
                  <div className="">
                    <div className="flex items-center justify-between">
                      {/* Step 1 */}
                      <div className={cn(
                        "flex items-center gap-1.5",
                        hasSelectedType ? "text-corporate-blue-700" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                          hasSelectedType 
                            ? "bg-corporate-blue-100 border-2 border-corporate-blue-400 text-corporate-blue-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          {hasSelectedType ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            '1'
                          )}
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-[11px] font-medium leading-tight">Selecciona</div>
                        </div>
                      </div>
                      
                      {/* Connector */}
                      <div className="flex-1 mx-2 sm:mx-3">
                        <div className="h-0.5 bg-slate-200 rounded-full relative overflow-hidden">
                          <div 
                            className={cn(
                              "absolute left-0 top-0 h-full bg-corporate-blue-400 transition-all duration-500",
                              hasChangedData ? "w-full" : "w-0" // Fills when data changes
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Step 2 */}
                      <div className={cn(
                        "flex items-center gap-1.5",
                        isPersonalized ? "text-corporate-blue-700" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                          isPersonalized 
                            ? "bg-corporate-blue-100 border-2 border-corporate-blue-400 text-corporate-blue-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          {isPersonalized ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            '2'
                          )}
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-[11px] font-medium leading-tight">
                            Personaliza
                          </div>
                        </div>
                      </div>
                      
                      {/* Connector */}
                      <div className="flex-1 mx-2 sm:mx-3">
                        <div className="h-0.5 bg-slate-200 rounded-full relative overflow-hidden">
                          <div 
                            className={cn(
                              "absolute left-0 top-0 h-full bg-corporate-blue-400 transition-all duration-500",
                              isPersonalized ? "w-full" : "w-0" // Fills when options change
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Step 3 */}
                      <div className={cn(
                        "flex items-center gap-1.5",
                        hasChangedData ? "text-green-600" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                          hasChangedData 
                            ? "bg-green-100 border-2 border-green-400 text-green-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          3
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-[11px] font-medium leading-tight">Descarga</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="space-y-6 px-6 pb-6 pt-0">
                  
                  {/* Tarjeta 1: Datos */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/50 backdrop-blur-sm border border-blue-200/60 dark:border-blue-800/60 rounded-lg p-4">
                    {/* Selector de tipo de contenido QR */}
                    {selectedType === 'qrcode' && (
                      <div className="mb-4">
                        <QRContentSelector
                          selectedQRType={selectedQRType}
                          onQRTypeChange={handleQRTypeChange}
                          isLoading={isLoading}
                        />
                      </div>
                    )}
                    
                    {/* Formularios dinámicos para QR Code */}
                    {selectedType === 'qrcode' ? (
                      <div className="space-y-4">
                        <QRForm
                          type={selectedQRType}
                          data={qrFormData[selectedQRType]}
                          onChange={handleQRFormChange}
                          isLoading={isLoading}
                          validationError={selectedQRType === 'link' ? realTimeValidationError : null}
                          urlValidation={selectedQRType === 'link' ? {
                            isValidating: isValidatingUrl,
                            metadata: urlMetadata,
                            error: urlValidationError
                          } : undefined}
                          onUrlValidationComplete={selectedQRType === 'link' ? (exists, error, url) => handleUrlValidationComplete(exists, error, url) : undefined}
                          urlExists={selectedQRType === 'link' ? urlValidationState.exists : undefined}
                          onGenerateAnyway={selectedQRType === 'link' ? handleGenerateAnyway : undefined}
                          shouldShowGenerateAnywayButton={selectedQRType === 'link' && urlValidationState.exists === false && !urlValidationState.shouldGenerateAnyway}
                        />
                        
                        {/* Smart QR Button - Solo para URLs */}
                        {selectedQRType === 'link' && qrFormData.link.url && (
                          <SmartQRButton 
                            url={qrFormData.link.url}
                            onGenerate={async (config) => {
                              // Apply Smart QR configuration to current form
                              console.log('[SmartQR] Applying configuration:', config);
                              
                              // Update form data with Smart QR config
                              if (config.gradient) {
                                setValue('options.gradient_enabled', true);
                                setValue('options.gradient_type', config.gradient.type);
                                if (config.gradient.colors && config.gradient.colors.length >= 2) {
                                  setValue('options.gradient_color1', config.gradient.colors[0]);
                                  setValue('options.gradient_color2', config.gradient.colors[1]);
                                }
                                if (config.gradient.angle !== undefined) {
                                  setValue('options.gradient_direction', 
                                    config.gradient.angle === 0 ? 'left-right' : 
                                    config.gradient.angle === 90 ? 'top-bottom' :
                                    'diagonal'
                                  );
                                }
                              }
                              
                              if (config.eyeShape) {
                                setValue('options.eye_shape', config.eyeShape);
                              }
                              
                              if (config.dataPattern) {
                                setValue('options.data_pattern', config.dataPattern);
                              }
                              
                              if (config.logo) {
                                // TODO: Handle logo upload/selection
                                console.log('[SmartQR] Logo configuration:', config.logo);
                              }
                              
                              // Generate QR with Smart QR config using centralized state
                              const formData = getValues();
                              
                              console.log('=== SMART QR GENERATION TRIGGER ===');
                              console.log('Form Data:', formData);
                              console.log('Smart QR Config:', JSON.stringify(config, null, 2));
                              console.log('===================================');
                              
                              await generateWithState(formData, {
                                isSmartQR: true,
                                smartQRConfig: config
                              });
                            }}
                          />
                        )}
                        
                        {/* Botón para generar - oculto cuando auto-generación está habilitada */}
                        {!autoGenerationEnabled && (
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-10 bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generando...
                              </div>
                            ) : (
                              "Generar"
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      /* Formulario simple para códigos que no son QR */
                      <div className="flex gap-3">
                        <Input
                          {...register('data', {
                            onChange: (e) => trackInput(e.target.value)
                          })}
                          placeholder="Ingresa el contenido..."
                          className={cn(
                            "h-10 flex-1",
                            errors.data && "border-red-400 dark:border-red-600"
                          )}
                        />
                        {!autoGenerationEnabled && (
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                              "h-10 px-6 font-medium flex-shrink-0",
                              "bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600",
                              "transition-all duration-200"
                            )}
                          >
                            {isLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generando...
                              </div>
                            ) : (
                              "Generar"
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {errors.data && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {errors.data.message}
                      </p>
                    )}
                    
                    {/* Indicador de validación - Movido dentro de LinkForm con nuevo estilo */}
                  </div>
                  
                  {/* Tarjeta 2: Opciones Avanzadas - Always visible */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/50 dark:to-blue-900/50 backdrop-blur-sm border border-blue-200/60 dark:border-blue-800/60 rounded-lg p-4">
                    <GenerationOptions
                      control={control}
                      errors={errors}
                      watch={watch}
                      isLoading={isLoading}
                      selectedType={selectedType}
                      reset={reset}
                      setValue={setValue}
                      getValues={getValues}
                      onSubmit={onSubmit}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Columna de vista previa con v2 */}
            <section className="lg:col-span-1 relative">
              {/* Componente de fondo visible - solo para altura visual */}
              <div id="preview-background" className="absolute inset-0 hero-card backdrop-blur-xl bg-white/40 dark:bg-slate-950/40 z-0"></div>
              
              {/* Componente funcional invisible - para sticky */}
              <PreviewSection
                svgContent={svgContent}
                enhancedData={enhancedData}
                isLoading={isLoading}
                barcodeType={selectedType}
                isUsingV2={false}
                isUsingV3Enhanced={selectedType === 'qrcode'}
                showCacheIndicator={false}
                isUserTyping={isTyping && hasUserStartedTyping}
                validationError={realTimeValidationError || validationError}
                isInitialDisplay={false}
                className="sticky-preview relative z-20"
                urlGenerationState={generationState}
              />
            </section>
          </div>
        </form>
      </main>

      {/* Sección Hero */}
      <section className="relative bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm border-t border-slate-200/30 dark:border-slate-700/30 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-300 text-sm font-medium shadow-lg backdrop-blur-sm">
              <QrCode className="h-4 w-4" />
              Generador Profesional
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-200 dark:to-slate-100 bg-clip-text text-transparent">
                Códigos QR y Barras
              </span>
              <br />
              <span className="text-blue-600 dark:text-blue-400">de Calidad Profesional</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Genera códigos de alta calidad con opciones avanzadas de personalización para uso empresarial y personal.
            </p>
          </div>
        </div>
      </section>

      {/* Sección de características */}
      <section className="relative bg-gradient-to-b from-transparent to-blue-50/30 dark:to-blue-950/30 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm p-8 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Generación Rápida</h3>
              <p className="text-slate-600 dark:text-slate-400">Motor optimizado para crear códigos al instante</p>
            </div>
            
            <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm p-8 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Múltiples Formatos</h3>
              <p className="text-slate-600 dark:text-slate-400">Soporte para QR, Code128, EAN13 y más</p>
            </div>
            
            <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm p-8 rounded-xl border border-blue-100/40 dark:border-blue-900/40">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalización Total</h3>
              <p className="text-slate-600 dark:text-slate-400">Colores, tamaños y estilos personalizables</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de casos de uso */}
      <section className="relative py-24 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Casos de Uso Populares</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Menús de Restaurante", icon: "🍽️", desc: "QR para menús digitales" },
              { title: "Tarjetas de Visita", icon: "💼", desc: "Información de contacto" },
              { title: "Inventario", icon: "📦", desc: "Control de productos" },
              { title: "Eventos", icon: "🎫", desc: "Tickets y entradas" },
              { title: "Marketing", icon: "📱", desc: "Campañas y promociones" },
              { title: "WiFi", icon: "📶", desc: "Acceso rápido a redes" },
              { title: "Pagos", icon: "💳", desc: "Transacciones seguras" },
              { title: "Educación", icon: "📚", desc: "Material educativo" }
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/30 p-6 rounded-lg border border-blue-100/30 dark:border-blue-900/30">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de estadísticas */}
      <section className="relative py-24 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">1M+</div>
              <p className="text-slate-600 dark:text-slate-400">Códigos Generados</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">15</div>
              <p className="text-slate-600 dark:text-slate-400">Tipos de Código</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">99.9%</div>
              <p className="text-slate-600 dark:text-slate-400">Disponibilidad</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</div>
              <p className="text-slate-600 dark:text-slate-400">Soporte</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer placeholder */}
      <footer className="relative py-16 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm border-t border-slate-200/30 dark:border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <p className="mb-4">© 2025 CODEX - Generador Profesional de Códigos</p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Términos</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contacto</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}