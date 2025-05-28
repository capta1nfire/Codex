'use client'; // Necesario para usar hooks como useState y manejar eventos

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BarcodeDisplay from './BarcodeDisplay';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
// import { useAuth } from '@/context/AuthContext';
import { Download, Printer, QrCode, Settings, Palette } from 'lucide-react';
import BarcodeTypeSelector from '@/components/generator/BarcodeTypeSelector';
import GenerationOptions from '@/components/generator/GenerationOptions';


import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

// Interfaz para el error estructurado devuelto por el backend
interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
}

// --- Función auxiliar para obtener datos por defecto según el tipo ---
function getDefaultDataForType(barcodeType: string): string {
  switch (barcodeType.toLowerCase()) {
    case 'qrcode':
      return 'https://tu-sitio-web.com';
    case 'code128':
      return 'CODE128 Ejemplo 123';
    case 'pdf417':
      return 'Texto de ejemplo un poco más largo para PDF417.';
    case 'ean13':
      return '978020137962'; // 12 dígitos
    case 'ean8':
      return '1234567'; // 7 dígitos
    case 'upca':
      return '03600029145'; // 11 dígitos
    case 'upce':
      return '012345'; // 6 dígitos (requiere empezar 0 o 1)
    case 'code39':
      return 'CODE-39-EJEMPLO';
    case 'code93':
      return 'CODE 93 EXAMPLE';
    case 'codabar':
      return 'A123456789B';
    case 'itf':
      return '123456789012'; // 12 dígitos (ITF requiere par, 14 es común)
    case 'datamatrix':
      return 'DataMatrix ejemplo 123';
    case 'aztec':
      return 'Texto de ejemplo para Aztec';
    default:
      return ''; // O un mensaje genérico
  }
}

// Definir los valores por defecto fuera del componente
const defaultFormValues: GenerateFormData = {
  barcode_type: 'qrcode',
  data: getDefaultDataForType('qrcode'),
  options: {
    scale: 4,
    fgcolor: '#000000',
    bgcolor: '#FFFFFF',
    height: 100,
    includetext: true,
    ecl: 'M',
  },
};

export default function Home() {
  // --- Estados ---
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);
  // const { user } = useAuth(); // Ya no necesitamos user directamente aquí si userRole no se usa
  // const userRole = user?.role; // userRole ya no se pasa a los hijos relevantes

  // --- react-hook-form Configuración ---
  const {
    register, // Para inputs estándar como 'data'
    handleSubmit,
    control, // Para componentes UI como Select, Slider, Switch
    watch, // Para observar cambios en los campos del formulario
    setValue, // Para actualizar campos programáticamente
    getValues, // Usar getValues
    reset, // Obtener la función reset
    formState: { errors }, // Re-add formState errors
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onBlur', // O 'onChange' para feedback más inmediato
    defaultValues: defaultFormValues, // Usar la constante
  });

  // Observar el tipo de código seleccionado para lógica condicional
  const selectedType = watch('barcode_type');

  // --- Variables Derivadas (Se mueven a GenerationOptions.tsx) ---
  // const is1DBarcode = selectedType ? !['qrcode', 'pdf417', 'datamatrix', 'aztec'].includes(selectedType) : false;
  // const isHeightRelevant = selectedType ? !['qrcode', 'datamatrix', 'aztec'].includes(selectedType) : false;
  // const isQrCode = selectedType === 'qrcode';

  // --- Handlers ---

  // Definir onSubmit PRIMERO porque handleTypeChange lo usa
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    console.log('[onSubmit] Datos validados recibidos:', formData);
    console.log('[onSubmit] formData.options ANTES de construir payload:', formData.options);
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };

    // Determinar qué opciones enviar basado en el tipo (AHORA en el backend)
    // Ya no necesitamos limpiar el payload aquí, el backend ignora opciones irrelevantes
    // if (!isHeightRelevant && payload.options.height !== undefined) delete payload.options.height;
    // if (!is1DBarcode && payload.options.includetext !== undefined) delete payload.options.includetext;
    // if (!isQrCode && payload.options.ecl !== undefined) delete payload.options.ecl;
    // if (payload.options.fgcolor === '') delete payload.options.fgcolor;
    // if (payload.options.bgcolor === '') delete payload.options.bgcolor;

    console.log('[onSubmit] Preparando fetch con payload:', payload);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`;
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('[onSubmit] Resultado JSON recibido:', result);

      if (!response.ok) {
        let message = 'Error desconocido al generar el código.';
        let code: string | undefined = undefined;
        let suggestion: string | undefined = undefined;

        if (result && typeof result.error === 'object' && result.error !== null) {
          message = result.error.message || message;
          code = result.error.code;
          suggestion = result.error.context?.suggestion;
        } else if (result && result.error && typeof result.error === 'string') {
          message = result.error;
        } else if (result && result.message) {
          message = result.message;
        }

        console.error('[onSubmit] Error de backend:', { status: response.status, result });
        setServerError({
          success: false,
          error: message,
          suggestion,
          code,
        });
        setSvgContent('');
      } else {
        console.log('[onSubmit] Generación exitosa.');
        setSvgContent(result.svgString);
        setServerError(null);
      }
    } catch (err) {
      console.error('[onSubmit] Error en fetch o procesando:', err);
      setServerError({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión o inesperado.',
      });
      setSvgContent('');
    } finally {
      setIsLoading(false);
      console.log('[onSubmit] Finalizado.');
    }
  }, []);

  // Definir handleTypeChange DESPUÉS de onSubmit
  const handleTypeChange = useCallback(
    async (newType: string) => {
      const newData = getDefaultDataForType(newType);
      // Actualizar tipo y datos
      setValue('barcode_type', newType, { shouldValidate: true });
      setValue('data', newData, { shouldValidate: true });
      setServerError(null);

      // Obtener TODOS los valores actuales del formulario DESPUÉS de actualizarlos
      const currentFormValues = getValues();

      console.log(
        `[handleTypeChange] Tipo cambiado a ${newType}. Llamando a onSubmit con valores completos:`,
        currentFormValues
      );
      // Llamar a onSubmit con el objeto completo
      await onSubmit(currentFormValues);

      // Quitar el objeto parcial anterior
      // await onSubmit({
      //   barcode_type: newType,
      //   data: newData,
      // });
    },
    [setValue, onSubmit, getValues]
  ); // Añadir getValues a las dependencias

  // useEffect para generar al montar
  useEffect(() => {
    console.log('[useEffect] Montado. Llamando a onSubmit con valores por defecto.');
    // Llamar a onSubmit directamente aquí puede causar problemas si aún no está definida
    // o si sus dependencias no están listas. Es más seguro obtener los valores
    // por defecto y llamar a onSubmit con ellos.
    onSubmit(defaultFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- Cambiar dependencia a [] para que solo se ejecute al montar

  // --- Action Handlers ---
  const handleDownload = useCallback(() => {
    if (!svgContent) return;

    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    const safeFilename = (selectedType || 'barcode').replace(/[^a-z0-9]/gi, '_').toLowerCase();

    downloadLink.href = svgUrl;
    downloadLink.download = `${safeFilename}_${Date.now()}.svg`; // Add timestamp for uniqueness
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    console.log('[handleDownload] SVG descargado.');
  }, [svgContent, selectedType]);

  const handlePrint = useCallback(() => {
    if (!svgContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Simple print structure: just the SVG
      printWindow.document.write(`
        <html>
          <head><title>Imprimir Código</title></head>
          <body style="text-align: center; margin-top: 50px;">
            ${svgContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); }; // Close after printing attempt
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close(); // Important for some browsers
      console.log('[handlePrint] Diálogo de impresión abierto.');
    } else {
      console.error(
        '[handlePrint] No se pudo abrir la ventana de impresión. Verifica bloqueadores de pop-ups.'
      );
      alert(
        'No se pudo abrir la ventana de impresión. Por favor, revisa si tu navegador está bloqueando las ventanas emergentes.'
      );
    }
  }, [svgContent]);

  // --- Renderizado ---
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 border-b border-blue-200/20 dark:border-blue-800/20">
        <div className="absolute inset-0 bg-grid-slate-100/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Hero Title */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                Generador Avanzado
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-slate-100 dark:via-blue-200 dark:to-slate-100 bg-clip-text text-transparent">
                  Códigos QR y Barras
                </span>
                <br />
                <span className="text-blue-600 dark:text-blue-400">
                  Profesionales
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Genera códigos de barras y QR de alta calidad con opciones avanzadas de personalización. 
                Perfecto para uso empresarial y personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Generator */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 xl:grid-cols-3 gap-8"
        >
          {/* Compact Configuration - Left Column */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Essential Settings Card - Compacted */}
            <Card className="shadow-xl shadow-blue-500/10 border-border/50 bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configuración</CardTitle>
                    <CardDescription className="text-sm">Tipo y datos principales</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Type Selector - Compact */}
                <BarcodeTypeSelector
                  control={control}
                  isLoading={isLoading}
                  handleTypeChange={handleTypeChange}
                  errors={errors}
                />

                {/* Data Input - Compact */}
                <div className="space-y-2">
                  <Label htmlFor="data-input" className="text-sm font-semibold flex items-center gap-2">
                    Datos
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                      {selectedType?.toUpperCase()}
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="data-input"
                      placeholder={getDefaultDataForType(selectedType || 'qrcode')}
                      {...register('data')}
                      disabled={isLoading}
                      className={cn(
                        "h-10 transition-all duration-200 focus:scale-[1.02]",
                        errors.data ? 'border-destructive' : 'focus:border-blue-500 focus:ring-blue-500/20'
                      )}
                    />
                    {watch('data') && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {watch('data').length}
                      </div>
                    )}
                  </div>
                  {errors.data && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <span className="w-1 h-1 bg-destructive rounded-full"></span>
                      {errors.data.message}
                    </p>
                  )}
                </div>

                {/* Generate Button - Compact but Prominent */}
                <Button 
                  type="submit" 
                  className={cn(
                    "w-full h-12 text-base font-semibold rounded-xl",
                    "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600",
                    "hover:from-blue-700 hover:via-blue-800 hover:to-blue-700",
                    "shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40",
                    "transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5",
                    "border border-blue-500/20"
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      <span>Generar</span>
                      <span className="text-blue-200">⚡</span>
                    </div>
                  )}
                </Button>

                {/* Server Error Display - Compact */}
                {serverError && (
                  <Card className="border-destructive/50 bg-destructive/5 backdrop-blur-sm">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                          <p className="text-sm font-semibold text-destructive">Error</p>
                        </div>
                        <p className="text-xs text-destructive/80">{serverError.error}</p>
                        {serverError.suggestion && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                              <span className="font-medium">💡</span> {serverError.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Advanced Options - Compact Collapsible */}
            <Card className="shadow-lg shadow-indigo-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Personalización</CardTitle>
                    <CardDescription className="text-sm">Colores y opciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GenerationOptions
                  control={control}
                  errors={errors}
                  watch={watch}
                  isLoading={isLoading}
                  selectedType={selectedType}
                  reset={reset}
                />
              </CardContent>
            </Card>
          </div>

          {/* DOMINANT Preview Column - Takes 2/3 of space */}
          <div className="xl:col-span-2">
            <Card className="shadow-2xl shadow-blue-500/10 border-border/50 bg-card/95 backdrop-blur-sm sticky top-6 min-h-[600px]">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <QrCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Vista Previa</CardTitle>
                      <CardDescription className="text-base">Tu código generado en tiempo real</CardDescription>
                    </div>
                  </div>
                  {svgContent && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Listo</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Main Preview Display - DOMINANT */}
                  <div className="relative">
                    {isLoading ? (
                      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-dashed border-blue-200 dark:border-blue-800">
                        <div className="text-center space-y-6">
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
                            <QrCode className="absolute inset-0 m-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xl font-medium text-slate-700 dark:text-slate-300">Generando código...</p>
                            <p className="text-slate-500 dark:text-slate-400">Esto tomará solo un momento</p>
                          </div>
                        </div>
                      </div>
                    ) : serverError ? (
                      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-2xl border border-dashed border-red-200 dark:border-red-800">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-3xl">⚠️</span>
                          </div>
                          <div>
                            <p className="text-xl font-medium text-red-700 dark:text-red-400">Error en la generación</p>
                            <p className="text-red-600 dark:text-red-500">Revisa la configuración</p>
                          </div>
                        </div>
                      </div>
                    ) : svgContent ? (
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 min-h-[400px] flex items-center justify-center">
                        <div className="w-full max-w-md">
                          <BarcodeDisplay
                            key={selectedType}
                            svgContent={svgContent}
                            type={selectedType}
                            data={watch('data')}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="text-center space-y-6">
                          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto">
                            <QrCode className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xl font-medium text-slate-700 dark:text-slate-300">Tu código aparecerá aquí</p>
                            <p className="text-slate-500 dark:text-slate-400">Configura y genera para ver el resultado</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Enhanced for Dominant View */}
                  {svgContent && !isLoading && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          disabled={!svgContent || isLoading}
                          size="lg"
                          className="h-14 border-2 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-105 text-base"
                        >
                          <Download className="mr-3 h-5 w-5" />
                          Descargar SVG
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handlePrint} 
                          disabled={!svgContent || isLoading}
                          size="lg"
                          className="h-14 border-2 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-105 text-base"
                        >
                          <Printer className="mr-3 h-5 w-5" />
                          Imprimir
                        </Button>
                      </div>
                      
                      {/* Enhanced Info Panel */}
                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                            <span className="text-lg">✨</span>
                            Código generado exitosamente
                          </p>
                          <div className="grid grid-cols-3 gap-4 text-xs text-blue-600 dark:text-blue-400">
                            <div className="text-center">
                              <p className="font-medium">Formato</p>
                              <p>SVG</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">Resolución</p>
                              <p>Vectorial</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">Calidad</p>
                              <p>Alta</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
}
