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
import { useDebounce } from '@/hooks/useDebounce';
import { isContentValid, shouldWaitForMoreInput } from '@/utils/validators';

// Hooks personalizados
import { useBarcodeGeneration } from '@/hooks/useBarcodeGeneration';
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

  // Hooks personalizados
  const { svgContent, isLoading, serverError, generateBarcode, clearError } = useBarcodeGeneration();
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
  
  // Estados para generación automática
  const [isTyping, setIsTyping] = useState(false);
  const debouncedData = useDebounce(watchedData, 800); // Incrementado de 400ms
  const debouncedQRFormData = useDebounce(qrFormData[selectedQRType] || {}, 1000); // Incrementado de 600ms

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

  // Generar al montar - solo una vez
  useEffect(() => {
    const timer = setTimeout(() => {
      onSubmit(defaultFormValues);
    }, 100);
    return () => clearTimeout(timer);
  }, []); // Sin dependencias para ejecutar solo una vez

  // Generación automática con debounce
  useEffect(() => {
    // Solo para códigos de barra normales (no QR)
    if (selectedType !== 'qrcode' && debouncedData && debouncedData.trim()) {
      const currentFormValues = getValues();
      onSubmit(currentFormValues);
    }
  }, [debouncedData, selectedType, getValues, onSubmit]);

  // Generación automática para QR con validación
  useEffect(() => {
    if (selectedType === 'qrcode') {
      const qrContent = generateQRContent(selectedQRType, debouncedQRFormData);
      
      // Validar si el contenido es suficiente para generar
      if (isContentValid(selectedQRType, debouncedQRFormData) && 
          !shouldWaitForMoreInput(selectedQRType, qrContent)) {
        setValue('data', qrContent, { shouldValidate: true });
        const currentFormValues = getValues();
        onSubmit(currentFormValues);
      }
    }
  }, [debouncedQRFormData, selectedType, selectedQRType, generateQRContent, setValue, getValues, onSubmit]);

  // Detectar cuando el usuario está escribiendo
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 500);
    return () => clearTimeout(timer);
  }, [watchedData, qrFormData]);

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        {/* Tabs de tipos de código */}
        <BarcodeTypeTabs 
          selectedType={selectedType} 
          onTypeChange={handleTypeChange} 
        />

        <form onSubmit={handleSubmit(onSubmit)} className="scroll-smooth">
          <div className="generator-grid">
            {/* Columna de configuración */}
            <section className="configuration-column" id="form-content">
              <Card className="shadow-corporate-md hover:shadow-corporate-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 bg-white dark:bg-slate-950">
                <CardContent className="p-0">
                  {/* Sección 1: Contenido */}
                  <div className="px-6 py-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-900/50">
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
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">1. Complete el contenido</h3>
                        <QRForm
                          type={selectedQRType}
                          data={qrFormData[selectedQRType]}
                          onChange={handleQRFormChange}
                          isLoading={isLoading}
                        />
                      </div>
                    ) : (
                      /* Formulario simple para códigos que no son QR */
                      <div className="w-full">
                        <Input
                          {...register('data')}
                          placeholder="Ingresa el contenido..."
                          className={cn(
                            "h-10 w-full",
                            errors.data && "border-red-400 dark:border-red-600"
                          )}
                        />
                      </div>
                    )}
                    
                    {errors.data && (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                        {errors.data.message}
                      </p>
                    )}
                  </div>

                  {/* Sección 2: Diseño - Solo para QR */}
                  {selectedType === 'qrcode' && (
                    <div className="px-6 pb-4 bg-gradient-to-b from-corporate-blue-50/30 to-transparent dark:from-corporate-blue-950/20">
                      <h3 className="text-sm font-semibold text-corporate-blue-700 dark:text-corporate-blue-300 mb-4">2. Diseña tu código QR</h3>
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
                </CardContent>
              </Card>
            </section>

            {/* Columna de vista previa - Sticky */}
            <section className="lg:col-span-1 shadow-corporate-md border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 hover:shadow-corporate-lg transition-shadow duration-200">
              <PreviewSection
                svgContent={svgContent}
                isLoading={isLoading}
                serverError={serverError}
                selectedType={selectedType}
                data={watchedData}
                gradientOptions={{
                  enabled: watch('options.gradient_enabled') || false,
                  type: watch('options.gradient_type') || 'linear',
                  color1: watch('options.gradient_color1') || '#3B82F6',
                  color2: watch('options.gradient_color2') || '#8B5CF6',
                  direction: watch('options.gradient_direction') || 'top-bottom',
                  borders: watch('options.gradient_borders') || false,
                }}
                scale={watchedScale}
                onScaleChange={handleScaleChange}
                isTyping={isTyping}
                isWaitingForValidInput={
                  selectedType === 'qrcode' 
                    ? shouldWaitForMoreInput(selectedQRType, watchedData)
                    : false
                }
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

      {/* Secciones placeholder para permitir más scroll */}
      <section className="bg-white dark:bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">Características Principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h3 className="text-xl font-semibold mb-3">Alta Calidad</h3>
                <p className="text-slate-600 dark:text-slate-400">Genera códigos de alta resolución optimizados para impresión y uso digital.</p>
              </div>
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h3 className="text-xl font-semibold mb-3">Múltiples Formatos</h3>
                <p className="text-slate-600 dark:text-slate-400">Soporta más de 15 tipos de códigos de barras y QR con opciones personalizables.</p>
              </div>
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h3 className="text-xl font-semibold mb-3">Descarga Instantánea</h3>
                <p className="text-slate-600 dark:text-slate-400">Exporta en PNG, SVG, PDF y EPS para cualquier necesidad profesional.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-950 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">¿Por qué CODEX?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-3">Para Empresas</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>• API REST para integración</li>
                  <li>• Generación en lotes</li>
                  <li>• Análisis y estadísticas</li>
                  <li>• Soporte prioritario</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-3">Para Usuarios</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li>• Interfaz intuitiva</li>
                  <li>• Sin marcas de agua</li>
                  <li>• Historial de códigos</li>
                  <li>• Personalización avanzada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">¿Listo para empezar?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Únete a miles de usuarios que confían en CODEX</p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
              Crear cuenta gratuita
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg">
              Ver planes
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}