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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-slate-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header consistente con otras páginas */}
      <div className="bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-blue-50/50 dark:from-blue-950/20 dark:via-slate-950/20 dark:to-blue-950/20 border-b border-blue-200/30 dark:border-blue-800/30 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <QrCode className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                CODEX
              </h1>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1 font-medium">
                Generador avanzado de códigos de barras y QR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Columna de Configuración (Izquierda) */}
          <div className="space-y-6">
            {/* Card de Configuración Principal */}
            <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Configuración del Código
                </CardTitle>
                <CardDescription>
                  Selecciona el tipo de código y los datos a codificar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Selección de Tipo */}
                <BarcodeTypeSelector
                  control={control}
                  isLoading={isLoading}
                  handleTypeChange={handleTypeChange}
                  errors={errors}
                />

                {/* 2. Input de Datos */}
                <div className="space-y-2">
                  <Label htmlFor="data-input" className="text-base font-semibold">
                    Datos a Codificar
                  </Label>
                  <Input
                    id="data-input"
                    placeholder={getDefaultDataForType(selectedType || 'qrcode')}
                    {...register('data')}
                    disabled={isLoading}
                    className={`h-11 ${errors.data ? 'border-destructive' : ''}`}
                  />
                  {errors.data && (
                    <p className="text-sm text-destructive">{errors.data.message}</p>
                  )}
                </div>

                {/* 3. Botón Generar */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generando...
                    </div>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generar Código
                    </>
                  )}
                </Button>

                {/* 4. Mensajes de Error del Servidor */}
                {serverError && (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="font-semibold text-destructive">Error al generar:</p>
                        <p className="text-sm text-destructive">{serverError.error}</p>
                        {serverError.suggestion && (
                          <p className="text-sm text-destructive">
                            <span className="font-medium">Sugerencia:</span> {serverError.suggestion}
                          </p>
                        )}
                        {serverError.code && (
                          <p className="text-xs font-mono text-destructive/70">
                            Código: {serverError.code}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Card de Opciones de Personalización */}
            <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Opciones de Personalización
                </CardTitle>
                <CardDescription>
                  Ajusta la apariencia y características del código generado
                </CardDescription>
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

          {/* Columna de Previsualización (Derecha) */}
          <div className="space-y-6">
            <Card className="shadow-lg shadow-blue-500/10 border-border/50 bg-card/80 backdrop-blur-sm h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl">Previsualización</CardTitle>
                <CardDescription>
                  Vista previa del código generado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  {/* Lógica condicional para mostrar carga/error/svg/placeholder */}
                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[200px] bg-muted/50 rounded-lg border border-dashed border-border p-8 w-full">
                      <div className="text-center flex flex-col items-center text-muted-foreground">
                        <div
                          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"
                          role="status"
                        ></div>
                        <p className="font-medium">Generando código...</p>
                      </div>
                    </div>
                  ) : serverError ? (
                    <div className="flex items-center justify-center min-h-[200px] bg-destructive/5 rounded-lg border border-dashed border-destructive/50 p-8 text-destructive w-full">
                      <p className="text-center font-medium">
                        Error al generar. Revisa las opciones y los datos.
                      </p>
                    </div>
                  ) : svgContent ? (
                    <div className="w-full">
                      <BarcodeDisplay
                        key={selectedType}
                        svgContent={svgContent}
                        type={selectedType}
                        data={watch('data')}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] bg-muted/50 rounded-lg border border-dashed border-border p-8 w-full">
                      <div className="text-center text-muted-foreground">
                        <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">La previsualización aparecerá aquí</p>
                        <p className="text-sm mt-1">Configura y genera tu código</p>
                      </div>
                    </div>
                  )}

                  {/* Acciones (Descargar, Imprimir) */}
                  {svgContent && !isLoading && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                      <Button
                        variant="outline"
                        onClick={handleDownload}
                        disabled={!svgContent || isLoading}
                        className="flex-1 border-border/50 hover:border-border hover:bg-card hover:shadow-md transition-all duration-200"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar SVG
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handlePrint} 
                        disabled={!svgContent || isLoading}
                        className="flex-1 border-border/50 hover:border-border hover:bg-card hover:shadow-md transition-all duration-200"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                      </Button>
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
