'use client'; // Necesario para usar hooks como useState y manejar eventos

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import BarcodeDisplay from './BarcodeDisplay';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema';
import { useAuth } from '@/context/AuthContext';
import { Download, Printer } from 'lucide-react';
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
  // Eliminar useStates para campos del formulario
  // const [data, setData] = useState<string>(getDefaultDataForType('qrcode'));
  // const [type, setType] = useState<string>('qrcode');
  // const [scale, setScale] = useState<number>(4);
  // const [foregroundColor, setForegroundColor] = useState<string>('#000000');
  // const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  // const [showText, setShowText] = useState<boolean>(true);
  // const [height, setHeight] = useState<number>(100);
  // const [qrEcl, setQrEcl] = useState<string>('M');

  // Mantener estados para UI y resultado
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
    <main className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">CODEX</h1>

      {/* Cambiar a grid de 2 columnas en md */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
      >
        {/* Columna de Configuración (Izquierda) */}
        <div className="md:col-span-1 space-y-6">
          {/* Aplicar bg-card y border-border */}
          <div className="bg-card p-6 border border-border rounded-lg shadow-md space-y-4">
            {/* 1. Selección de Tipo (Usar componente) */}
            <BarcodeTypeSelector
              control={control}
              isLoading={isLoading}
              handleTypeChange={handleTypeChange}
              errors={errors}
            />

            {/* 2. Input de Datos */}
            <div>
              <Label htmlFor="data-input" className="text-lg font-semibold mb-2 block">
                Datos a Codificar
              </Label>
              <Input
                id="data-input"
                placeholder={getDefaultDataForType(selectedType || 'qrcode')}
                // Registrar con RHF
                {...register('data')}
                disabled={isLoading}
                // Aplicar border-destructive en error
                className={`${errors.data ? 'border-destructive' : ''}`}
              />
              {/* Mostrar error para data usando text-destructive */}
              {errors.data && (
                <p className="mt-1 text-sm text-destructive">{errors.data.message}</p>
              )}
            </div>

            {/* 3. Botón Generar */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Generando...' : 'Generar Código'}
            </Button>

            {/* 4. Mensajes de Error del Servidor - Aplicar colores destructive */}
            {serverError && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md space-y-1">
                <p className="font-medium">Error al generar:</p>
                <p className="text-sm">{serverError.error}</p>
                {serverError.suggestion && (
                  <p className="text-sm">
                    <span className="font-medium">Sugerencia:</span> {serverError.suggestion}
                  </p>
                )}
                {serverError.code && (
                  <p className="text-xs font-mono">Código: {serverError.code}</p>
                )}
              </div>
            )}
          </div>{' '}
          {/* Cerrar div wrapper de tarjeta */}
          {/* 5. Opciones de Personalización (Usar componente) */}
          <GenerationOptions
            control={control}
            errors={errors}
            watch={watch}
            isLoading={isLoading}
            selectedType={selectedType}
            reset={reset}
          />
        </div>{' '}
        {/* Cerrar Columna Izquierda */}
        {/* Columna de Previsualización (Derecha) */}
        <div className="md:col-span-1">
          {/* Contenido de Previsualización */}
          {/* Añadir clases para centrar el contenido verticalmente */}
          <div className="flex flex-col items-center">
            {/* Lógica condicional para mostrar carga/error/svg/placeholder */}
            {isLoading ? (
              // Aplicar bg-muted, border-border, text-muted-foreground y border-primary para spinner
              <div className="flex items-center justify-center min-h-[200px] bg-muted rounded border border-dashed border-border p-4 w-full max-w-md">
                <div className="text-center flex flex-col items-center text-muted-foreground">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"
                    role="status"
                  ></div>
                  <p>Generando código...</p>
                </div>
              </div>
            ) : serverError ? (
              // Aplicar colores destructive
              <div className="flex items-center justify-center min-h-[150px] bg-destructive/10 rounded border border-dashed border-destructive p-4 text-destructive w-full max-w-md">
                <p className="text-center">Error al generar. Revisa las opciones y los datos.</p>
              </div>
            ) : svgContent ? (
              <BarcodeDisplay
                key={selectedType}
                svgContent={svgContent}
                type={selectedType}
                data={watch('data')}
              />
            ) : (
              // Aplicar bg-muted, border-border, text-muted-foreground
              <div className="flex items-center justify-center min-h-[150px] bg-muted rounded border border-dashed border-border p-4 w-full max-w-md">
                <p className="text-muted-foreground text-center">
                  La previsualización aparecerá aquí.
                </p>
              </div>
            )}

            {/* Acciones (Descargar, Imprimir) */}
            {svgContent && !isLoading && (
              <div className="mt-6 flex justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!svgContent || isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar SVG
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={!svgContent || isLoading}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            )}
          </div>
        </div>{' '}
        {/* Cerrar Columna Derecha */}
      </form>
    </main>
  );
}
