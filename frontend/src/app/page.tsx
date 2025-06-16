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

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { QrCode, Check } from 'lucide-react';
import GenerationOptions from '@/components/generator/GenerationOptions';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Hooks personalizados
import { useBarcodeGenerationV2 } from '@/hooks/useBarcodeGenerationV2';
import { useQRContentGeneration } from '@/hooks/useQRContentGeneration';
import { useBarcodeTypes } from '@/hooks/useBarcodeTypes';
import { useSmartAutoGeneration } from '@/hooks/useSmartAutoGeneration';

// Componentes modulares
import { BarcodeTypeTabs } from '@/components/generator/BarcodeTypeTabs';
import { QRContentSelector } from '@/components/generator/QRContentSelector';
import { QRForm } from '@/components/generator/QRForms';
import { PreviewSection } from '@/components/generator/PreviewSectionV3';
import { useTypingTracker } from '@/hooks/useTypingTracker';

// Constantes
import { getDefaultDataForType } from '@/constants/barcodeTypes';
import { defaultFormValues } from '@/constants/defaultFormValues';

// Validación
import { SmartValidators } from '@/lib/smartValidation';

export default function Home() {
  // Estados principales
  const [expandedSection, setExpandedSection] = useState<string>('advanced');
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [realTimeValidationError, setRealTimeValidationError] = useState<string | null>(null);
  const [hasUserStartedTyping, setHasUserStartedTyping] = useState(false);
  const [isFirstChange, setIsFirstChange] = useState(true);

  // Hooks personalizados con v2
  const { 
    svgContent, 
    isLoading, 
    serverError, 
    metadata, 
    generateBarcode, 
    clearError,
    isUsingV2 
  } = useBarcodeGenerationV2();
  
  // Typing tracker for sophisticated placeholder system
  const { isTyping, trackInput, resetTyping } = useTypingTracker({
    typingDebounceMs: 150,
    onStopTyping: () => {
      // Generar cuando el usuario deja de escribir
      if (selectedType === 'qrcode' && hasUserStartedTyping) {
        const currentFormValues = getValues();
        const currentQRData = qrFormData[selectedQRType];
        validateAndGenerate(currentFormValues, selectedQRType, currentQRData);
      }
    }
  });
  
  // Usar serverError para evitar warning
  if (serverError) {
    console.error('Server error:', serverError);
  }
  
  const { 
    selectedQRType, 
    setSelectedQRType, 
    qrFormData, 
    generateQRContent, 
    updateQRFormData 
  } = useQRContentGeneration();

  // Hook de auto-generación inteligente
  const autoGenerationEnabled = true; // Feature flag for auto-generation
  
  const {
    validateAndGenerate,
    isAutoGenerating,
    validationError
  } = useSmartAutoGeneration({
    enabled: autoGenerationEnabled
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
  const watchedScale = watch('options.scale') || 2;

  // Handlers
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    await generateBarcode(formData);
  }, [generateBarcode]);

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
    
    // Reset typing state when changing QR types
    if (newQRType === 'link') {
      setHasUserStartedTyping(false);
      setIsFirstChange(true);
    }
    resetTyping();
    
    const initialData = qrFormData[newQRType];
    const qrContent = generateQRContent(newQRType, initialData);
    
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
  }, [setValue, getValues, onSubmit, qrFormData, generateQRContent, setSelectedQRType, resetTyping]);

  const handleQRFormChange = useCallback((type: string, field: string, value: any) => {
    // Mark that user has started typing
    if (!hasUserStartedTyping && type === 'link' && field === 'url') {
      setHasUserStartedTyping(true);
      setIsFirstChange(false);
    }
    
    // Track typing for UI feedback
    trackInput(value.toString());
    
    const newQRContent = updateQRFormData(type, field, value);
    setValue('data', newQRContent, { shouldValidate: true });
    
    // Validate in real-time without generating
    const updatedFormData = { ...qrFormData[selectedQRType], [field]: value };
    const validator = SmartValidators[selectedQRType as keyof typeof SmartValidators];
    
    if (validator) {
      const result = validator(updatedFormData);
      if (!result.isValid) {
        // Only show error if there's a message (not empty string)
        const errorMessage = result.message || '';
        setRealTimeValidationError(errorMessage === '' ? null : errorMessage);
      } else {
        setRealTimeValidationError(null);
      }
    }
  }, [updateQRFormData, setValue, trackInput, qrFormData, selectedQRType, hasUserStartedTyping]);

  const handleScaleChange = useCallback((newScale: number) => {
    setValue('options.scale', newScale);
  }, [setValue]);

  // Generate initial QR on mount
  useEffect(() => {
    const generateInitialBarcode = async () => {
      if (selectedType === 'qrcode') {
        // Generate QR with default URL on initial load
        const defaultURL = 'https://tu-sitio-web.com';
        const initialFormData = {
          ...defaultFormValues,
          barcode_type: 'qrcode',
          data: defaultURL,
          options: {
            ...defaultFormValues.options,
          }
        };
        await onSubmit(initialFormData);
      } else {
        // Generate other barcode types normally
        await onSubmit(defaultFormValues);
      }
    };
    
    generateInitialBarcode();
    
    // Mark that initial mount is complete after a delay
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-generación para códigos lineales y 2D (no QR)
  useEffect(() => {
    if (selectedType !== 'qrcode' && watchedData && watchedData.length > 0) {
      const currentFormValues = getValues();
      validateAndGenerate(currentFormValues);
    }
  }, [watchedData, selectedType, getValues, validateAndGenerate]);

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

  // Calculate current step based on state
  const currentStep = (() => {
    if (!selectedType) return 1;
    if (watchedData === getDefaultDataForType(selectedType) && watchedScale === 2) return 2;
    return 3;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-blue-50 to-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Tabs de tipos de código */}
        <BarcodeTypeTabs 
          selectedType={selectedType} 
          onTypeChange={handleTypeChange} 
        />

        <form onSubmit={handleSubmit(onSubmit)} className="scroll-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna de configuración */}
            <section className="lg:col-span-2 space-y-4" id="form-content">
              <Card className="hero-card border-2 border-corporate-blue-200 shadow-corporate-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      Configuración
                    </CardTitle>
                    {/* Configuration status indicator */}
                    {(watchedData !== getDefaultDataForType(selectedType) || watchedScale !== 2) && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <Check className="h-3 w-3" />
                        <span>Personalizado</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                {/* Progress Steps Bar */}
                <div className="px-6 pb-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      {/* Step 1 */}
                      <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 1 ? "text-corporate-blue-700" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                          currentStep >= 1 
                            ? "bg-corporate-blue-100 border-2 border-corporate-blue-400 text-corporate-blue-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          1
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-xs font-medium">Paso 1</div>
                          <div className="text-xs">Selecciona tipo</div>
                        </div>
                      </div>
                      
                      {/* Connector */}
                      <div className="flex-1 mx-2 sm:mx-4">
                        <div className="h-1 bg-slate-200 rounded-full relative overflow-hidden">
                          <div 
                            className={cn(
                              "absolute left-0 top-0 h-full bg-corporate-blue-400 transition-all duration-500",
                              currentStep >= 2 ? "w-full" : "w-0"
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Step 2 */}
                      <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 2 ? "text-corporate-blue-700" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                          currentStep >= 2 
                            ? "bg-corporate-blue-100 border-2 border-corporate-blue-400 text-corporate-blue-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          2
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-xs font-medium">Paso 2</div>
                          <div className="text-xs">Personaliza</div>
                        </div>
                      </div>
                      
                      {/* Connector */}
                      <div className="flex-1 mx-2 sm:mx-4">
                        <div className="h-1 bg-slate-200 rounded-full relative overflow-hidden">
                          <div 
                            className={cn(
                              "absolute left-0 top-0 h-full bg-corporate-blue-400 transition-all duration-500",
                              currentStep >= 3 ? "w-full" : "w-0"
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Step 3 */}
                      <div className={cn(
                        "flex items-center gap-2",
                        currentStep >= 3 ? "text-green-600" : "text-slate-400"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                          currentStep >= 3 
                            ? "bg-green-100 border-2 border-green-400 text-green-700" 
                            : "bg-slate-100 border-2 border-slate-300"
                        )}>
                          3
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-xs font-medium">Paso 3</div>
                          <div className="text-xs">Descarga</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="space-y-6 pt-0">
                  
                  {/* Tarjeta 1: Datos */}
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    {/* Selector de tipo de contenido QR */}
                    {selectedType === 'qrcode' && (
                      <QRContentSelector
                        selectedQRType={selectedQRType}
                        onQRTypeChange={handleQRTypeChange}
                        isLoading={isLoading}
                      />
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
                        />
                        
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
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Opciones Avanzadas</h4>
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
            <section className={cn(
              "border-2 rounded-lg transition-all duration-500",
              currentStep >= 3 
                ? "border-green-400 dark:border-green-500" 
                : "border-slate-300 dark:border-slate-700"
            )}>
              <PreviewSection
                svgContent={svgContent}
                isLoading={isLoading}
                barcodeType={selectedType}
                isUsingV2={isUsingV2}
                showCacheIndicator={metadata?.fromCache}
                isUserTyping={isTyping && hasUserStartedTyping}
                validationError={realTimeValidationError || validationError}
                isInitialDisplay={!hasUserStartedTyping && selectedType === 'qrcode'}
              />
            </section>
          </div>
        </form>
      </main>

      {/* Sección Hero */}
      <section className="bg-gradient-to-br from-slate-50/60 via-white/80 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30 border-t border-slate-200/50 dark:border-slate-700/50 mt-8">
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
    </div>
  );
}