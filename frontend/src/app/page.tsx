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
      {/* Main Generator - Hero-Driven Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8"
        >
          {/* LEVEL 1: Essential Controls - Minimal Visual Weight */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Primary Input Card - Clean & Minimal */}
            <Card className="border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  Configuración Esencial
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Type Selector */}
                <BarcodeTypeSelector
                  control={control}
                  isLoading={isLoading}
                  handleTypeChange={handleTypeChange}
                  errors={errors}
                />

                {/* Data Input */}
                <div className="space-y-2">
                  <Label htmlFor="data-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Contenido
                  </Label>
                  <Input
                    id="data-input"
                    placeholder={getDefaultDataForType(selectedType || 'qrcode')}
                    {...register('data')}
                    disabled={isLoading}
                    className={cn(
                      "h-12 transition-all duration-200",
                      errors.data ? 'border-destructive' : 'focus:border-blue-500 focus:ring-blue-500/20'
                    )}
                  />
                  {errors.data && (
                    <p className="text-xs text-destructive">{errors.data.message}</p>
                  )}
                </div>

                {/* HERO MOMENT: Generate Button */}
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className={cn(
                      "w-full h-14 text-lg font-bold rounded-xl",
                      "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600",
                      "hover:from-blue-700 hover:via-blue-800 hover:to-blue-700",
                      "shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
                      "transform hover:scale-[1.02] transition-all duration-300",
                      "border-2 border-blue-400/50 hover:border-blue-300",
                      isLoading && "animate-pulse cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                        Generando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6" />
                        Generar Código
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* LEVEL 2: Customization - Collapsed by Default */}
            <Card className="border border-slate-200/40 dark:border-slate-700/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Personalización
                  <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
                    Opcional
                  </span>
                </CardTitle>
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

          {/* HERO AREA: Code Preview - DOMINANT 3/5 of space */}
          <div className="lg:col-span-3">
            <Card className="border-2 border-blue-200/50 dark:border-blue-700/50 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 shadow-xl shadow-blue-500/10 sticky top-6 min-h-[700px]">
              <CardHeader className="border-b border-blue-200/30 dark:border-blue-700/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <QrCode className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                        Vista Previa
                      </CardTitle>
                      <CardDescription className="text-lg text-slate-600 dark:text-slate-400">
                        Tu código generado en tiempo real
                      </CardDescription>
                    </div>
                  </div>
                  {svgContent && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full border border-green-200 dark:border-green-700">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">Completado</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-8 lg:p-12">
                <div className="space-y-8">
                  {/* HERO: Main Preview Display - Maximum Visual Impact */}
                  <div className="relative">
                    {isLoading ? (
                      <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-blue-950/30 rounded-3xl border-2 border-dashed border-blue-300 dark:border-blue-700">
                        <div className="text-center space-y-8">
                          <div className="relative">
                            <div className="w-24 h-24 border-4 border-blue-200 dark:border-blue-700 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
                            <QrCode className="absolute inset-0 m-auto h-10 w-10 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">Generando código...</p>
                            <p className="text-lg text-slate-500 dark:text-slate-400">Creando tu código perfecto</p>
                          </div>
                        </div>
                      </div>
                    ) : serverError ? (
                      <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-red-50 via-orange-50 to-red-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-red-950/30 rounded-3xl border-2 border-dashed border-red-300 dark:border-red-700">
                        <div className="text-center space-y-6">
                          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                            <span className="text-4xl">⚠️</span>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">Error en la generación</p>
                            <p className="text-lg text-red-600 dark:text-red-500">{serverError.error}</p>
                            {serverError.suggestion && (
                              <p className="text-sm text-red-500 dark:text-red-400 mt-2">{serverError.suggestion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : svgContent ? (
                      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-blue-950/30 rounded-3xl p-12 border-2 border-slate-200 dark:border-slate-700 min-h-[500px] flex items-center justify-center shadow-inner">
                        <div className="w-full transform hover:scale-[1.02] transition-transform duration-300">
                          <BarcodeDisplay
                            key={selectedType}
                            svgContent={svgContent}
                            type={selectedType}
                            data={watch('data')}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <div className="text-center space-y-8">
                          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                            <QrCode className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">Tu código aparecerá aquí</p>
                            <p className="text-lg text-slate-500 dark:text-slate-400">Configura y genera para ver el resultado</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HERO ACTIONS: Download & Print - Enhanced */}
                  {svgContent && !isLoading && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          disabled={!svgContent || isLoading}
                          size="lg"
                          className={cn(
                            "h-16 border-2 border-blue-200 dark:border-blue-700",
                            "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30",
                            "hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50",
                            "hover:border-blue-300 dark:hover:border-blue-600",
                            "transform hover:scale-105 transition-all duration-200",
                            "text-base font-semibold text-blue-700 dark:text-blue-300",
                            "shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20"
                          )}
                        >
                          <Download className="mr-3 h-6 w-6" />
                          Descargar SVG
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handlePrint} 
                          disabled={!svgContent || isLoading}
                          size="lg"
                          className={cn(
                            "h-16 border-2 border-slate-200 dark:border-slate-700",
                            "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950/30 dark:to-slate-900/30",
                            "hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-900/50 dark:hover:to-slate-800/50",
                            "hover:border-slate-300 dark:hover:border-slate-600",
                            "transform hover:scale-105 transition-all duration-200",
                            "text-base font-semibold text-slate-700 dark:text-slate-300",
                            "shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20"
                          )}
                        >
                          <Printer className="mr-3 h-6 w-6" />
                          Imprimir
                        </Button>
                      </div>
                      
                      {/* Success Info Panel - Corporate Style */}
                      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-green-950/20 rounded-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 shadow-lg shadow-green-500/10">
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">
                              Código generado exitosamente
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-sm">
                            <div className="text-center space-y-1">
                              <p className="font-semibold text-green-800 dark:text-green-200">Formato</p>
                              <p className="text-green-600 dark:text-green-400">SVG Vectorial</p>
                            </div>
                            <div className="text-center space-y-1">
                              <p className="font-semibold text-green-800 dark:text-green-200">Calidad</p>
                              <p className="text-green-600 dark:text-green-400">Alta Resolución</p>
                            </div>
                            <div className="text-center space-y-1">
                              <p className="font-semibold text-green-800 dark:text-green-200">Tipo</p>
                              <p className="text-green-600 dark:text-green-400">{selectedType?.toUpperCase()}</p>
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

      {/* Hero Section - Simplified and Moved Down */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="absolute inset-0 bg-grid-slate-100/30 dark:bg-grid-slate-800/30 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-sm font-medium">
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
