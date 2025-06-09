'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { QrCode, Zap } from 'lucide-react';
import GenerationOptions from '@/components/generator/GenerationOptions';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { isContentValid, shouldWaitForMoreInput } from '@/utils/validators';

// Enhanced hooks with v2 support
import { useBarcodeGenerationV2 } from '@/hooks/useBarcodeGenerationV2';
import { useQRContentGeneration } from '@/hooks/useQRContentGeneration';
import { useBarcodeTypes } from '@/hooks/useBarcodeTypes';

// Feature flags
import { isFeatureEnabled } from '@/config/feature-flags';
import { FeatureFlagsPanel } from '@/components/FeatureFlagsPanel';

// Componentes modulares
import { BarcodeTypeTabs } from '@/components/generator/BarcodeTypeTabs';
import { QRContentSelector } from '@/components/generator/QRContentSelector';
import { QRForm } from '@/components/generator/QRForms';
import { PreviewSection } from '@/components/generator/PreviewSectionV2';

// Constantes
import { getDefaultDataForType } from '@/constants/barcodeTypes';
import { defaultFormValues } from '@/constants/defaultFormValues';

// V2 Badge component
function V2Badge({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
      <Zap className="w-3 h-3" />
      v2
    </span>
  );
}

export default function HomeV2() {
  // Estados principales
  const [expandedSection, setExpandedSection] = useState<string>('advanced');

  // Enhanced hooks with v2 support
  const { 
    svgContent, 
    isLoading, 
    serverError, 
    metadata, 
    generateBarcode, 
    clearError,
    isUsingV2 
  } = useBarcodeGenerationV2();
  
  const { 
    selectedQRType, 
    setSelectedQRType, 
    qrFormData, 
    generateQRContent, 
    updateQRFormData 
  } = useQRContentGeneration();

  // react-hook-form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors: formErrors },
    watch,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: defaultFormValues,
  });

  // Observadores de formulario
  const selectedType = watch('barcode_type');
  const customText = watch('data');
  const debouncedText = useDebounce(customText, 1500);

  // Hooks adicionales
  const { isBarcodeQR } = useBarcodeTypes();
  const isQR = isBarcodeQR(selectedType);

  // Estados derivados
  const hasErrors = serverError !== null;
  const showGenerateButton = !isQR || selectedQRType === 'custom';
  const shouldAutoGenerate = !showGenerateButton && debouncedText;

  // Feature flags
  const showV2Features = isFeatureEnabled('QR_V2_CUSTOMIZATION_UI');
  const showCacheIndicator = isFeatureEnabled('QR_V2_CACHE_INDICATOR');
  const showPerformanceMetrics = isFeatureEnabled('QR_V2_PERFORMANCE_METRICS');

  // Manejadores
  const handleQRTypeSelect = useCallback((type: string) => {
    setSelectedQRType(type);
    if (type === 'custom') {
      // En modo custom, usar el texto actual del input
      const currentData = getValues('data');
      if (currentData && currentData !== getDefaultDataForType(selectedType)) {
        // Mantener el texto actual si es diferente al default
        return;
      }
    }
  }, [setSelectedQRType, getValues, selectedType]);

  const handleQRFormSubmit = useCallback(async (data: any) => {
    const content = generateQRContent(selectedQRType, data);
    setValue('data', content);
    
    // Trigger validation
    const isValid = await trigger('data');
    if (isValid) {
      // Generar automáticamente después de actualizar
      setTimeout(() => {
        handleSubmit(onSubmitHandler)();
      }, 100);
    }
  }, [selectedQRType, generateQRContent, setValue, trigger, handleSubmit]);

  const onSubmitHandler = useCallback(async (data: GenerateFormData) => {
    clearError();
    await generateBarcode(data);
  }, [generateBarcode, clearError]);

  // Efectos
  useEffect(() => {
    if (selectedType) {
      const defaultData = getDefaultDataForType(selectedType);
      setValue('data', defaultData);
      
      // Reset QR type selection cuando cambia el tipo
      if (isBarcodeQR(selectedType)) {
        setSelectedQRType('custom');
      }
    }
  }, [selectedType, setValue, isBarcodeQR, setSelectedQRType]);

  // Auto-generación con debounce
  useEffect(() => {
    if (!shouldAutoGenerate) return;
    
    const trimmedText = debouncedText.trim();
    
    if (!isContentValid(trimmedText, selectedType)) {
      return;
    }
    
    if (shouldWaitForMoreInput(trimmedText, selectedType)) {
      return;
    }
    
    handleSubmit(onSubmitHandler)();
  }, [debouncedText, shouldAutoGenerate, selectedType, handleSubmit, onSubmitHandler]);

  const handleToggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Generador de Códigos
            {isUsingV2 && <V2Badge show={true} />}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Crea códigos QR y de barras profesionales con opciones avanzadas de personalización
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel de configuración */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
                  {/* Selector de tipo de código */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Tipo de Código
                    </label>
                    <BarcodeTypeTabs
                      selectedType={selectedType}
                      onTypeChange={(type) => setValue('barcode_type', type)}
                    />
                  </div>

                  {/* Selector de contenido QR */}
                  {isQR && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tipo de Contenido
                      </label>
                      <QRContentSelector
                        selectedType={selectedQRType}
                        onTypeSelect={handleQRTypeSelect}
                        showV2Features={showV2Features}
                      />
                    </div>
                  )}

                  {/* Formulario específico del tipo QR o input de texto */}
                  {isQR && selectedQRType !== 'custom' ? (
                    <QRForm
                      type={selectedQRType}
                      data={qrFormData}
                      onSubmit={handleQRFormSubmit}
                      onDataChange={updateQRFormData}
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {isQR ? 'Contenido del QR' : 'Datos'}
                      </label>
                      <Input
                        {...register('data')}
                        placeholder={isQR ? 'Ingresa URL, texto o datos...' : 'Ingresa el código...'}
                        className={cn(
                          "h-12 text-base transition-colors bg-white dark:bg-slate-950",
                          formErrors.data && "border-red-500 focus:border-red-500"
                        )}
                      />
                      {formErrors.data && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {formErrors.data.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Opciones avanzadas */}
                  <GenerationOptions
                    control={control}
                    errors={formErrors}
                    watch={watch}
                    isLoading={isLoading}
                    selectedType={selectedType}
                    reset={reset}
                    setValue={setValue}
                    getValues={getValues}
                    onSubmit={onSubmitHandler}
                    expandedSection={expandedSection}
                    onToggleSection={handleToggleSection}
                    showV2Features={showV2Features}
                  />

                  {/* Botón de generar */}
                  {showGenerateButton && (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5 mr-2" />
                          Generar Código
                        </>
                      )}
                    </Button>
                  )}
                </form>

                {/* Errores */}
                {hasErrors && serverError && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                          Error al generar
                        </h3>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                          {serverError.error}
                        </p>
                        {serverError.suggestion && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                            💡 {serverError.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance metrics */}
                {showPerformanceMetrics && metadata && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Engine:</span>
                      <span className="font-medium">{metadata.engineVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Processing:</span>
                      <span className="font-medium">{metadata.generationTimeMs}ms</span>
                    </div>
                    {metadata.complexityLevel && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Complexity:</span>
                        <span className="font-medium">{metadata.complexityLevel}</span>
                      </div>
                    )}
                    {showCacheIndicator && (
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Cache:</span>
                        <span className={cn(
                          "font-medium",
                          metadata.fromCache ? "text-green-600" : "text-slate-600"
                        )}>
                          {metadata.fromCache ? 'HIT' : 'MISS'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de vista previa - Sticky mejorado */}
          <div className="lg:col-span-5">
            <div className="sticky top-4">
              <PreviewSection
                svgContent={svgContent}
                isLoading={isLoading}
                barcodeType={selectedType}
                isUsingV2={isUsingV2}
                showCacheIndicator={showCacheIndicator && metadata?.fromCache}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature flags panel (dev only) */}
      <FeatureFlagsPanel />
    </div>
  );
}