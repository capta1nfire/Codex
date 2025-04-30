'use client'; // Necesario para usar hooks como useState y manejar eventos

import { useState, useCallback, useEffect } from 'react';
import { Disclosure } from '@headlessui/react'; // Importamos Disclosure
import { Input } from '@/components/ui/input'; // Descomentar/Añadir Input
import { Label } from '@/components/ui/label'; // Importar Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Importar Select
import { Button } from '@/components/ui/button'; // Importar Button
import { Slider } from '@/components/ui/slider'; // Añadir Slider
import { Switch } from '@/components/ui/switch'; // Añadir Switch
import {
  // ChevronDown, // Remove unused
  // ChevronUp, // Remove unused
  // Info, // Remove unused
  // AlertCircle, // Remove unused
  // Copy, // Remove unused
  Download, // Re-import Download
  Printer, // Re-import Printer
} from 'lucide-react';
import BarcodeDisplay from './BarcodeDisplay'; // Importamos el componente de display refactorizado
// Importar hook form y schema
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateFormSchema, GenerateFormData } from '@/schemas/generate.schema'; // Importar el nuevo schema

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
  const [serverError, setServerError] = useState<ErrorResponse | null>(null); // Renombrar error

  // --- react-hook-form Configuración ---
  const {
    register, // Para inputs estándar como 'data'
    handleSubmit,
    control, // Para componentes UI como Select, Slider, Switch
    watch, // Para observar cambios en los campos del formulario
    setValue, // Para actualizar campos programáticamente
    getValues, // Usar getValues
    formState: { errors }, // Re-add formState errors
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    mode: 'onBlur', // O 'onChange' para feedback más inmediato
    defaultValues: defaultFormValues, // Usar la constante
  });

  // Observar el tipo de código seleccionado para lógica condicional
  const selectedType = watch('barcode_type');

  // --- Variables Derivadas (basadas en el tipo observado) ---
  const is1DBarcode = selectedType ? !['qrcode', 'pdf417', 'datamatrix', 'aztec'].includes(selectedType) : false;
  const isHeightRelevant = selectedType ? !['qrcode', 'datamatrix', 'aztec'].includes(selectedType) : false;
  const isQrCode = selectedType === 'qrcode';

  // --- Handlers ---
  
  // Definir onSubmit PRIMERO porque handleTypeChange lo usa
  const onSubmit = useCallback(async (formData: GenerateFormData) => {
    console.log('[onSubmit] Datos validados recibidos:', formData);
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };
    
    if (!isHeightRelevant && payload.options.height !== undefined) delete payload.options.height;
    if (!is1DBarcode && payload.options.includetext !== undefined) delete payload.options.includetext;
    if (!isQrCode && payload.options.ecl !== undefined) delete payload.options.ecl;
    if (payload.options.fgcolor === '') delete payload.options.fgcolor;
    if (payload.options.bgcolor === '') delete payload.options.bgcolor;

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
             code 
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
  }, [is1DBarcode, isHeightRelevant, isQrCode]); 

  // Definir handleTypeChange DESPUÉS de onSubmit
  const handleTypeChange = useCallback(async (newType: string) => {
    const newData = getDefaultDataForType(newType);
    // Actualizar tipo y datos
    setValue('barcode_type', newType, { shouldValidate: true });
    setValue('data', newData, { shouldValidate: true });
    setServerError(null);

    // Obtener TODOS los valores actuales del formulario DESPUÉS de actualizarlos
    const currentFormValues = getValues();

    console.log(`[handleTypeChange] Tipo cambiado a ${newType}. Llamando a onSubmit con valores completos:`, currentFormValues);
    // Llamar a onSubmit con el objeto completo
    await onSubmit(currentFormValues);

    // Quitar el objeto parcial anterior
    // await onSubmit({ 
    //   barcode_type: newType, 
    //   data: newData, 
    // });

  }, [setValue, onSubmit, getValues]); // Añadir getValues a las dependencias
  
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
      console.error('[handlePrint] No se pudo abrir la ventana de impresión. Verifica bloqueadores de pop-ups.');
      alert('No se pudo abrir la ventana de impresión. Por favor, revisa si tu navegador está bloqueando las ventanas emergentes.');
    }
  }, [svgContent]);

  // --- Renderizado ---
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">CODEX</h1>

      {/* Cambiar a grid de 2 columnas en md */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Columna de Configuración (Izquierda) */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Añadir div wrapper con estilo de tarjeta para los controles principales */}
          <div className="bg-white p-6 border rounded-lg shadow-md space-y-4">
            {/* 1. Selección de Tipo */}
            <div>
              <Label htmlFor="barcode-type" className="text-lg font-semibold mb-2 block">Tipo de Código</Label>
              {/* Usar Controller para el Select */}
              <Controller
                name="barcode_type"
                control={control}
                render={({ field }) => (
                  <Select 
                    value={field.value}
                    // onValueChange ahora solo llama a handleTypeChange
                    onValueChange={handleTypeChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="barcode-type" className="w-full">
                      <SelectValue placeholder="Selecciona un tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Lista de tipos */}
                      <SelectItem value="qrcode">QR Code</SelectItem>
                      <SelectItem value="code128">Code 128</SelectItem>
                      <SelectItem value="pdf417">PDF417</SelectItem>
                      <SelectItem value="datamatrix">Data Matrix</SelectItem>
                      <SelectItem value="aztec">Aztec Code</SelectItem>
                      <SelectItem value="ean13">EAN-13</SelectItem>
                      <SelectItem value="ean8">EAN-8</SelectItem>
                      <SelectItem value="upca">UPC-A</SelectItem>
                      <SelectItem value="upce">UPC-E</SelectItem>
                      <SelectItem value="code39">Code 39</SelectItem>
                      <SelectItem value="code93">Code 93</SelectItem>
                      <SelectItem value="codabar">Codabar</SelectItem>
                      <SelectItem value="itf">ITF (Interleaved 2 of 5)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {/* Mostrar error para barcode_type */}
              {errors.barcode_type && (
                <p className="mt-1 text-sm text-red-600">{errors.barcode_type.message}</p>
              )}
            </div>

            {/* 2. Input de Datos */}
            <div>
              <Label htmlFor="data-input" className="text-lg font-semibold mb-2 block">Datos a Codificar</Label>
              <Input 
                id="data-input"
                placeholder={getDefaultDataForType(selectedType || 'qrcode')} 
                // Registrar con RHF
                {...register('data')} 
                disabled={isLoading}
                className={`${errors.data ? 'border-red-500' : ''}`}
              />
               {/* Mostrar error para data */}
              {errors.data && (
                <p className="mt-1 text-sm text-red-600">{errors.data.message}</p>
              )}
            </div>
          
            {/* 3. Botón Generar */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading} 
            >
              {isLoading ? 'Generando...' : 'Generar Código'}
            </Button>
           
            {/* 4. Mensajes de Error del Servidor */}
            {serverError && (
              <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md space-y-1">
                <p className="font-medium">Error al generar:</p>
                <p className="text-sm">{serverError.error}</p>
                {serverError.suggestion && (
                  <p className="text-sm"><span className="font-medium">Sugerencia:</span> {serverError.suggestion}</p>
                )}
                {serverError.code && (
                  <p className="text-xs font-mono">Código: {serverError.code}</p>
                )}
              </div>
            )}
          </div> {/* Cerrar div wrapper de tarjeta */} 
           
           {/* 5. Opciones de Personalización (Disclosure) - Queda fuera de la tarjeta anterior */}
           <Disclosure 
             as="div" 
             defaultOpen 
             className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
           >
            {() => (
              <>
                <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-lg font-semibold text-left text-gray-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                  <span>Opciones de Personalización</span>
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-4 pb-4 text-sm text-gray-500 space-y-6 border-t border-gray-200">
                  {/* Opciones Comunes (Escala, Colores) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    {/* Escala */}
                    <div>
                      <Label htmlFor="scale-slider">Escala ({watch('options.scale')})</Label>
                      {/* Usar Controller para Slider */}
                      <Controller
                        name="options.scale"
                        control={control}
                        defaultValue={4} // Default value for the slider itself
                        render={({ field }) => (
                           <Slider
                             id="scale-slider"
                             min={1}
                             max={10}
                             step={1}
                             value={[field.value ?? 4]} // Slider expects array
                             onValueChange={(value) => field.onChange(value[0])} // Update RHF state
                             disabled={isLoading}
                             className="mt-2"
                           />
                        )}
                      />
                       {/* Mostrar error */}
                       {errors.options?.scale && (
                         <p className="mt-1 text-xs text-red-600">{errors.options.scale.message}</p>
                       )}
                    </div>
                    {/* Color Frente */}
                    <div>
                       <Label htmlFor="fgcolor-input">Color Frente</Label>
                       {/* Usar Controller para Input de color */}
                       <Controller
                         name="options.fgcolor"
                         control={control}
                         defaultValue="#000000"
                         render={({ field }) => (
                           <div className="flex items-center gap-2 mt-1">
                              <Input 
                                id="fgcolor-input" 
                                type="text" 
                                {...field} // Pasar props de field
                                disabled={isLoading}
                                placeholder="#000000"
                                className={`flex-grow ${errors.options?.fgcolor ? 'border-red-500' : ''}`}
                              />
                              <Input 
                                type="color" 
                                value={field.value || '#000000'} // Controlar valor del color picker
                                onChange={field.onChange} // Actualizar estado RHF
                                className="w-10 h-10 p-0 border-none cursor-pointer"
                                disabled={isLoading}
                                aria-label="Seleccionar color de frente"
                              />
                           </div>
                         )}
                       />
                       {errors.options?.fgcolor && (
                         <p className="mt-1 text-xs text-red-600">{errors.options.fgcolor.message}</p>
                       )}
                    </div>
                    {/* Color Fondo */}
                     <div>
                       <Label htmlFor="bgcolor-input">Color Fondo</Label>
                       <Controller
                         name="options.bgcolor"
                         control={control}
                         defaultValue="#FFFFFF"
                         render={({ field }) => (
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                id="bgcolor-input" 
                                type="text" 
                                {...field}
                                disabled={isLoading}
                                placeholder="#FFFFFF"
                                className={`flex-grow ${errors.options?.bgcolor ? 'border-red-500' : ''}`}
                              />
                               <Input 
                                type="color" 
                                value={field.value || '#FFFFFF'} 
                                onChange={field.onChange}
                                className="w-10 h-10 p-0 border-none cursor-pointer"
                                disabled={isLoading}
                                aria-label="Seleccionar color de fondo"
                              />
                            </div>
                         )}
                       />
                       {errors.options?.bgcolor && (
                         <p className="mt-1 text-xs text-red-600">{errors.options.bgcolor.message}</p>
                       )}
                    </div>
                  </div>
                  
                  {/* Opciones Condicionales (Altura, Texto, ECL) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    {/* Altura (si es relevante) */}
                    {isHeightRelevant && (
                      <div>
                        <Label htmlFor="height-slider">Altura ({watch('options.height')}px)</Label>
                        <Controller
                          name="options.height"
                          control={control}
                          defaultValue={100}
                          render={({ field }) => (
                            <Slider
                              id="height-slider"
                              min={10}
                              max={500}
                              step={10}
                              value={[field.value ?? 100]}
                              onValueChange={(value) => field.onChange(value[0])}
                              disabled={isLoading}
                              className="mt-2"
                            />
                          )}
                        />
                        {errors.options?.height && (
                           <p className="mt-1 text-xs text-red-600">{errors.options.height.message}</p>
                         )}
                      </div>
                    )}
                    {/* Incluir Texto (si es 1D) */}
                    {is1DBarcode && (
                       <div className="flex items-center space-x-2 pt-5"> {/* Ajustar padding si es necesario */}
                          <Controller
                            name="options.includetext"
                            control={control}
                            defaultValue={true}
                            render={({ field }) => (
                              <Switch
                                id="show-text-switch"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                              />
                             )}
                           />
                         <Label htmlFor="show-text-switch">Mostrar Texto</Label>
                            {/* No suele haber errores para un switch */}
                       </div>
                    )}
                     {/* Nivel ECL (si es QR) */}
                    {isQrCode && (
                      <div>
                         <Label htmlFor="ecl-select">Nivel Corrección QR</Label>
                         <Controller
                           name="options.ecl"
                           control={control}
                           defaultValue="M"
                           render={({ field }) => (
                             <Select 
                               value={field.value}
                               onValueChange={field.onChange}
                               disabled={isLoading}
                             >
                               <SelectTrigger id="ecl-select" className="mt-1">
                                 <SelectValue placeholder="Selecciona nivel..." />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="L">L (Bajo)</SelectItem>
                                 <SelectItem value="M">M (Medio)</SelectItem>
                                 <SelectItem value="Q">Q (Alto)</SelectItem>
                                 <SelectItem value="H">H (Máximo)</SelectItem>
                               </SelectContent>
                             </Select>
                           )}
                         />
                         {errors.options?.ecl && (
                           <p className="mt-1 text-xs text-red-600">{errors.options.ecl.message}</p>
                         )}
                      </div>
                    )}
                  </div>

                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
           
        </div> {/* Cerrar Columna Izquierda */} 

        {/* Columna de Previsualización (Derecha) */}
        <div className="md:col-span-1">
          {/* Contenido de Previsualización */}
          {/* Añadir clases para centrar el contenido verticalmente */}
          <div className="flex flex-col items-center">
            {/* Lógica condicional para mostrar carga/error/svg/placeholder */}
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded border border-dashed border-gray-300 p-4 w-full max-w-md"> {/* Añadir w-full y max-width */}
                <div className="text-center flex flex-col items-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" role="status"></div>
                  <p>Generando código...</p>
                </div>
              </div>
            ) : serverError ? (
              <div className="flex items-center justify-center min-h-[150px] bg-red-50 rounded border border-dashed border-red-300 p-4 text-red-700 w-full max-w-md"> {/* Añadir w-full y max-width */}
                <p className="text-center">Error al generar. Revisa las opciones y los datos.</p>
              </div>
            ) : svgContent ? (
              <BarcodeDisplay key={selectedType} svgContent={svgContent} type={selectedType} data={watch('data')} />
            ) : (
               <div className="flex items-center justify-center min-h-[150px] bg-gray-50 rounded border border-dashed border-gray-300 p-4 w-full max-w-md"> {/* Añadir w-full y max-width */} 
                  <p className="text-gray-400 text-center">La previsualización aparecerá aquí.</p>
               </div>
            )}
             
            {/* Acciones (Descargar, Imprimir) */}
            {svgContent && !isLoading && (
               <div className="mt-6 flex justify-center space-x-4">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar SVG
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
               </div>
            )}
          </div>
        </div> {/* Cerrar Columna Derecha */} 
      </form>
    </main>
  );
}
