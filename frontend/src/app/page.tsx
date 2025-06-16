/**
 * @deprecated MARCADO PARA ELIMINACIÓN
 * 
 * Este archivo (page-optimized.tsx) está marcado para eliminación futura.
 * Fue la versión anterior del generador (v1) que ha sido actualizada para usar v2.
 * El contenido de este archivo ya fue copiado a page.tsx con las actualizaciones necesarias.
 * 
 * Razón: Este archivo ya no es necesario ya que su funcionalidad mejorada 
 * (con generador v2) ahora vive en page.tsx
 * 
 * Fecha de marcado: 11 de Diciembre, 2025
 * NO ELIMINAR AÚN - Mantener como respaldo temporal
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { QrCode } from 'lucide-react';
import GenerationOptions from '@/components/generator/GenerationOptions';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Hooks personalizados
import { useBarcodeGenerationV2 } from '@/hooks/useBarcodeGenerationV2';
import { useQRContentGeneration } from '@/hooks/useQRContentGeneration';
import { useBarcodeTypes } from '@/hooks/useBarcodeTypes';

// Componentes modulares
import { BarcodeTypeTabs } from '@/components/generator/BarcodeTypeTabs';
import { QRContentSelector } from '@/components/generator/QRContentSelector';
import { QRForm } from '@/components/generator/QRForms';
import { PreviewSection } from '@/components/generator/PreviewSection';

// Constantes
import { getDefaultDataForType } from '@/constants/barcodeTypes';
import { defaultFormValues } from '@/constants/defaultFormValues';

export default function Home() {
  // Estados principales
  const [expandedSection, setExpandedSection] = useState<string>('advanced');

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
  }, [setValue, onSubmit, getValues, clearError]);

  const handleQRTypeChange = useCallback(async (newQRType: string) => {
    setSelectedQRType(newQRType);
    
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
  }, [setValue, getValues, onSubmit, qrFormData, generateQRContent, setSelectedQRType]);

  const handleQRFormChange = useCallback((type: string, field: string, value: any) => {
    const newQRContent = updateQRFormData(type, field, value);
    setValue('data', newQRContent, { shouldValidate: true });
  }, [updateQRFormData, setValue]);

  const handleScaleChange = useCallback((newScale: number) => {
    setValue('options.scale', newScale);
  }, [setValue]);

  // Generar al montar
  useEffect(() => {
    onSubmit(defaultFormValues);
  }, []);

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
              <Card className="shadow-sm border-2 border-blue-400 dark:border-blue-600">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold">Configuración</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
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
                      />
                      
                      {/* Botón para generar */}
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
                    </div>
                  ) : (
                    /* Formulario simple para códigos que no son QR */
                    <div className="flex gap-3">
                      <Input
                        {...register('data')}
                        placeholder="Ingresa el contenido..."
                        className={cn(
                          "h-10 flex-1",
                          errors.data && "border-red-400 dark:border-red-600"
                        )}
                      />
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
                    </div>
                  )}
                  
                  {errors.data && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {errors.data.message}
                    </p>
                  )}
                  
                  {/* Separador */}
                  {expandedSection === 'advanced' && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
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
                        expandedSection={expandedSection}
                        setExpandedSection={setExpandedSection}
                      />
                    </div>
                  )}
                  
                  {/* Botón para mostrar opciones avanzadas */}
                  {expandedSection !== 'advanced' && (
                    <div className="pt-2">
                      <button
                        type="button"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => setExpandedSection('advanced')}
                      >
                        + Mostrar opciones avanzadas
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Columna de vista previa con v2 */}
            <section className="border-2 border-green-400 dark:border-green-600 rounded-lg">
              <PreviewSection
                svgContent={svgContent}
                isLoading={isLoading}
                barcodeType={selectedType}
                isUsingV2={isUsingV2}
                showCacheIndicator={metadata?.fromCache}
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