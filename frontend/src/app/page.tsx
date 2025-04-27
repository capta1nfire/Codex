'use client'; // Necesario para usar hooks como useState y manejar eventos

import { useState, useEffect } from 'react';
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
  // Download, // Remove unused
  // Printer, // Remove unused
} from 'lucide-react';

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

export default function Home() {
  // --- Estados con valores iniciales para QR ---
  const [data, setData] = useState<string>(getDefaultDataForType('qrcode')); // Usar función auxiliar
  const [type, setType] = useState<string>('qrcode'); // Tipo inicial QR
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // Empieza sin cargar
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [scale, setScale] = useState<number>(4);
  // const [errorLevel, setErrorLevel] = useState<string>(''); // Comment out unused state and setter

  // --- Nuevos Estados para Personalización Avanzada ---
  const [foregroundColor, setForegroundColor] = useState<string>('#000000');
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [showText, setShowText] = useState<boolean>(true); // Para códigos 1D
  const [height, setHeight] = useState<number>(100); // Altura para 1D/PDF417
  const [qrEcl, setQrEcl] = useState<string>('M'); // Nivel de corrección QR (L, M, Q, H)

  // --- Variables Derivadas ---
  const is1DBarcode = !['qrcode', 'pdf417', 'datamatrix'].includes(type);
  const isHeightRelevant = !['qrcode', 'datamatrix'].includes(type); // Incluye PDF417 y 1D
  const isQrCode = type === 'qrcode';

  // --- Handlers ---
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setData(getDefaultDataForType(newType)); // Actualizar datos al cambiar tipo
    setError(null); // Limpiar errores al cambiar de tipo
    // No llamamos a handleGenerate aquí para evitar generación automática al cambiar tipo
  };

  const handleGenerate = async () => {
    console.log('[handleGenerate] Iniciado.');
    console.log('[handleGenerate] Estado actual:', {
      data,
      type,
      isLoading,
      /* Añadir nuevas opciones si es útil */ scale,
      foregroundColor,
      backgroundColor,
      showText,
      height,
      qrEcl,
    });

    // --- Validaciones del lado del cliente ---
    setError(null); // Limpiar errores previos al inicio

    if (!data.trim()) {
      console.log('[handleGenerate] Error: Datos vacíos.');
      setError({ success: false, error: 'Por favor, introduce los datos a codificar.' });
      return;
    }

    if (type === 'ean13' && !/^\d{12}$/.test(data)) {
      console.log('[handleGenerate] Error: Formato EAN-13 inválido.');
      setError({
        success: false,
        error: 'Formato inválido para EAN-13.',
        suggestion: 'Debe contener exactamente 12 dígitos numéricos.',
      });
      return;
    }

    if (type === 'upca' && !/^\d{11}$/.test(data)) {
      console.log('[handleGenerate] Error: Formato UPC-A inválido.');
      setError({
        success: false,
        error: 'Formato inválido para UPC-A.',
        suggestion: 'Debe contener exactamente 11 dígitos numéricos.',
      });
      return;
    }
    // Añadir más validaciones aquí si es necesario (ej. Code39, etc.)

    console.log('[handleGenerate] Pasó validaciones.');
    setIsLoading(true);
    // setError(null); // Ya se limpió al inicio
    setSvgContent('');

    // Construir el objeto de opciones dinámicamente
    const options: Record<string, unknown> = {
      scale: scale,
      fgcolor: foregroundColor, // Usar nombres consistentes (ej. fgcolor, bgcolor)
      bgcolor: backgroundColor,
    };

    // Añadir opciones condicionales
    if (isHeightRelevant) {
      options.height = height;
    }
    if (is1DBarcode) {
      options.includetext = showText; // Nombre común para bibliotecas de códigos de barras
    }
    if (isQrCode) {
      options.ecl = qrEcl; // Nivel de corrección de errores para QR
    }

    console.log('[handleGenerate] Preparando fetch con:', { barcode_type: type, data, options });

    try {
      // Usar la variable de entorno para la URL del backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`;
      console.log('[handleGenerate] FETCHING URL:', requestUrl);
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode_type: type,
          data: data,
          options: options,
        }),
      });

      console.log('[handleGenerate] Fetch completado. Status:', response.status); // <-- Log 7: Después de fetch

      const result = await response.json();

      console.log('[handleGenerate] Resultado JSON recibido:', result); // <-- NUEVO LOG

      if (!response.ok) {
        let message = 'Error desconocido al generar el código.';
        let code: string | undefined = undefined;
        let suggestion: string | undefined = undefined;

        // Check if the error response has the nested structure from Node.js
        if (result && typeof result.error === 'object' && result.error !== null) {
          // Extract from { error: { message, code, context } }
          message = result.error.message || message;
          code = result.error.code;
          suggestion = result.error.context?.suggestion;
        } else if (result && typeof result.error === 'string') {
          // Handle potential flat error structure (e.g., from Rust directly?)
          message = result.error;
          code = result.code; // Attempt to get from top level
          suggestion = result.suggestion;
        }

        // Ensure the state matches the ErrorResponse interface
        const newErrorState: ErrorResponse = {
          success: false,
          error: message, // Ensure error is always a string
          code: typeof code === 'string' ? code : undefined,
          suggestion: typeof suggestion === 'string' ? suggestion : undefined,
        };
        console.log('ERROR set in !response.ok:', JSON.stringify(newErrorState, null, 2));
        setError(newErrorState);
        console.log(
          'DEBUG: setError called from !response.ok. New state:',
          JSON.stringify(newErrorState, null, 2)
        );
        return;
      }

      if (result.success && typeof result.svgString === 'string') {
        setSvgContent(result.svgString);
        setError(null);
        console.log('DEBUG: setError(null) llamado desde éxito.');
      } else {
        const errorObj =
          result && typeof result.error === 'object' && result.error !== null ? result.error : {};
        const errorMsg =
          typeof result.error === 'string'
            ? result.error
            : typeof errorObj.message === 'string'
              ? errorObj.message
              : 'Respuesta inválida recibida (se esperaba SVG).';
        const newErrorState = { success: false, error: errorMsg };
        console.log(
          'ERROR set in success=false/invalid SVG:',
          JSON.stringify(newErrorState, null, 2)
        );
        setError(newErrorState);
        console.log(
          'DEBUG: setError llamado desde else (success false o svgString inválido). Nuevo estado:',
          JSON.stringify(newErrorState, null, 2)
        );
      }
    } catch (err) {
      console.error('Error en handleGenerate:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Ocurrió un error inesperado.';
      const newErrorState = { success: false, error: errorMsg };
      console.log('ERROR set in catch(err):', JSON.stringify(newErrorState, null, 2));
      setError(newErrorState);
      console.log(
        'DEBUG: setError llamado desde catch(err). Nuevo estado:',
        JSON.stringify(newErrorState, null, 2)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- useEffect para generar al cargar ---
  useEffect(() => {
    console.log('[useEffect] Montado. Generando QR inicial.');
    // Solo genera si hay datos iniciales (evita llamadas vacías si getDefaultData retorna '')
    if (data) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío para que se ejecute solo al montar

  const handleDownload = () => {
    if (!svgContent) return;
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = svgUrl;
    const safeDataSubstring = data.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_') || 'imagen';
    const filename = `codigo_${type}_${safeDataSubstring}_escala${scale}.svg`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
  };

  const handlePrint = () => {
    console.log('Imprimiendo SVG...');
  };

  /* Remove unused function
  const handleCopySvg = () => {
    if (svgContent) {
      navigator.clipboard.writeText(svgContent)
        .then(() => {
          toast({ title: 'SVG copiado al portapapeles' });
        })
        .catch(err => {
          console.error('Error al copiar SVG:', err);
          toast({ title: 'Error al copiar', description: 'No se pudo copiar el SVG.', variant: 'destructive' });
        });
    }
  };
  */

  // const showErrorCorrection = type === 'qrcode'; // Unused
  // const showHeightOption = !['qrcode', 'datamatrix'].includes(type); // Unused

  // Return normal
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 print:p-0 bg-gray-100 text-gray-900">
      <h1 className="text-3xl font-bold mb-8 print:hidden text-gray-900">
        Generador de Códigos &quot;CODEX&quot;
      </h1>
      {/* Contenedor principal centrado con ancho máximo */}
      <div className="w-full max-w-7xl lg:max-w-screen-xl xl:max-w-screen-2xl print:max-w-full">
        {/* Layout de dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 print:block">
          {/* Columna Izquierda: Configuración */}
          <div className="space-y-6 print:hidden">
            {/* Tarjeta: Configuración Básica */}
            <div className="bg-white p-6 border rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuración</h2>
              {/* Datos a Codificar: Textarea */}
              <div className="mb-4">
                <Label
                  htmlFor="dataInput"
                  className="block mb-1.5 text-sm font-medium text-gray-800"
                >
                  Datos a Codificar:
                </Label>
                <textarea
                  id="dataInput"
                  placeholder={getDefaultDataForType(type)} // Usar placeholder dinámico
                  rows={4} // Altura inicial del textarea
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  disabled={isLoading}
                />
                {/* Ayuda contextual dinámica */}
                <div className="mt-1.5 text-xs text-gray-600 min-h-[2.4em]">
                  {/* Mantener un min-height para evitar saltos de layout */}
                  {type === 'qrcode' && <span>Cualquier texto o datos.</span>}
                  {type === 'code128' && <span>Caracteres ASCII (0-127).</span>}
                  {type === 'pdf417' && <span>Texto o datos binarios. Alta capacidad.</span>}
                  {type === 'ean13' && (
                    <span>
                      Exactamente 12 dígitos numéricos. El dígito de control se calcula
                      automáticamente.
                    </span>
                  )}
                  {type === 'upca' && (
                    <span>
                      Exactamente 11 dígitos numéricos. El dígito de control se calcula
                      automáticamente.
                    </span>
                  )}
                  {type === 'code39' && (
                    <span>
                      Letras mayúsculas (A-Z), números (0-9) y símbolos (-, ., , $, /, +, %).
                    </span>
                  )}
                  {type === 'datamatrix' && (
                    <span>Datos alfanuméricos o binarios. Alta capacidad.</span>
                  )}
                  {![
                    'qrcode',
                    'code128',
                    'pdf417',
                    'ean13',
                    'upca',
                    'code39',
                    'datamatrix',
                  ].includes(type) && (
                    <span>Introduce los datos a codificar.</span> // Mensaje genérico
                  )}
                </div>
              </div>
              {/* Tipo de Código: Select */}
              <div className="mb-4">
                <Label
                  htmlFor="typeSelect"
                  className="block mb-1.5 text-sm font-medium text-gray-800"
                >
                  Tipo de Código:
                </Label>
                <Select value={type} onValueChange={handleTypeChange} disabled={isLoading}>
                  <SelectTrigger
                    id="typeSelect"
                    className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  >
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qrcode">QR Code</SelectItem>
                    <SelectItem value="code128">Code 128</SelectItem>
                    <SelectItem value="pdf417">PDF417</SelectItem>
                    <SelectItem value="datamatrix">Data Matrix</SelectItem>
                    <SelectItem value="aztec">Aztec</SelectItem>
                    {/* 1D */}
                    <SelectItem value="ean13">EAN-13</SelectItem>
                    <SelectItem value="ean8">EAN-8</SelectItem>
                    <SelectItem value="upca">UPC-A</SelectItem>
                    <SelectItem value="upce">UPC-E</SelectItem>
                    <SelectItem value="code39">Code 39</SelectItem>
                    <SelectItem value="code93">Code 93</SelectItem>
                    <SelectItem value="codabar">Codabar</SelectItem>
                    <SelectItem value="itf">ITF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Botón Generar */}
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full text-base py-2.5 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-100 disabled:transition-none"
              >
                {isLoading ? 'Generando...' : 'Generar Código'}
              </Button>
            </div>

            {/* Tarjeta: Opciones de Personalización (Disclosure) */}
            <div className="bg-white border rounded-lg shadow-md overflow-hidden">
              <Disclosure defaultOpen={false}>
                {({ open }) => (
                  <div>
                    <Disclosure.Button className="flex justify-between items-center w-full px-4 py-3 text-sm font-medium text-left text-blue-900 bg-blue-50 hover:bg-blue-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                      <span>Opciones de Personalización</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className={`w-5 h-5 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </Disclosure.Button>

                    <Disclosure.Panel className="p-6 border-t space-y-6">
                      {/* --- Sección Apariencia --- */}
                      <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                        <legend className="text-sm font-medium text-gray-600 px-1 mb-2">
                          Apariencia
                        </legend>

                        {/* Escala (Tamaño General) */}
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                          <Label
                            htmlFor="scaleSlider"
                            className="text-sm font-medium text-gray-700"
                          >
                            Escala:
                          </Label>
                          <Slider
                            id="scaleSlider"
                            min={1}
                            max={10}
                            step={1}
                            value={[scale]}
                            onValueChange={(value) => setScale(value[0])}
                            disabled={isLoading}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
                          />
                          <Input
                            type="number"
                            id="scaleInput"
                            min={1}
                            max={10}
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))}
                            disabled={isLoading}
                            className="w-16 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                          />
                        </div>

                        {/* Colores */}
                        <div className="flex items-center space-x-4">
                          <Label
                            htmlFor="foregroundColor"
                            className="text-sm font-medium text-gray-700"
                          >
                            Color:
                          </Label>
                          <Input
                            type="color"
                            id="foregroundColor"
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            disabled={isLoading}
                            className="h-8 w-10 p-0 border-gray-300 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                          />
                          <Label
                            htmlFor="backgroundColor"
                            className="text-sm font-medium text-gray-700"
                          >
                            Fondo:
                          </Label>
                          <Input
                            type="color"
                            id="backgroundColor"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            disabled={isLoading}
                            className="h-8 w-10 p-0 border-gray-300 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                          />
                        </div>
                      </fieldset>

                      {/* --- Sección Visualización (Condicional) --- */}
                      {(is1DBarcode || isHeightRelevant) && (
                        <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                          <legend className="text-sm font-medium text-gray-600 px-1 mb-2">
                            Visualización
                          </legend>

                          {/* Mostrar Texto Legible (Solo 1D) */}
                          {is1DBarcode && (
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="showTextSwitch"
                                className="text-sm font-medium text-gray-700"
                              >
                                Mostrar Texto Legible:
                              </Label>
                              <Switch
                                id="showTextSwitch"
                                checked={showText}
                                onCheckedChange={setShowText}
                                disabled={isLoading}
                              />
                            </div>
                          )}

                          {/* Altura (1D y PDF417) */}
                          {isHeightRelevant && (
                            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                              <Label
                                htmlFor="heightSlider"
                                className="text-sm font-medium text-gray-700"
                              >
                                Altura (px):
                              </Label>
                              <Slider
                                id="heightSlider"
                                min={20}
                                max={200}
                                step={10}
                                value={[height]}
                                onValueChange={(value) => setHeight(value[0])}
                                disabled={isLoading}
                                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg"
                              />
                              <Input
                                type="number"
                                id="heightInput"
                                min={20}
                                max={200}
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                disabled={isLoading}
                                className="w-16 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                              />
                            </div>
                          )}
                        </fieldset>
                      )}

                      {/* --- Sección Avanzado (Condicional) --- */}
                      {isQrCode && (
                        <fieldset className="space-y-4 border border-gray-200 p-4 rounded-md">
                          <legend className="text-sm font-medium text-gray-600 px-1 mb-2">
                            Avanzado (Específico)
                          </legend>

                          {/* Nivel Corrección Errores (Solo QR) */}
                          <div>
                            <Label
                              htmlFor="qrEclSelect"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Nivel Corrección Errores (QR):
                            </Label>
                            <Select value={qrEcl} onValueChange={setQrEcl} disabled={isLoading}>
                              <SelectTrigger
                                id="qrEclSelect"
                                className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                              >
                                <SelectValue placeholder="Selecciona nivel" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="L">L (Bajo ~7%)</SelectItem>
                                <SelectItem value="M">M (Medio ~15%)</SelectItem>
                                <SelectItem value="Q">Q (Alto ~25%)</SelectItem>
                                <SelectItem value="H">H (Máximo ~30%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </fieldset>
                      )}
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            </div>

            {/* Área de Errores - Revertida a la versión con typeof checks */}
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg relative"
                role="alert"
              >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">
                  {typeof error.error === 'string' ? error.error : 'Ocurrió un error.'}
                </span>
                {/* Restablecer code y suggestion con verificación */}
                {error.suggestion && typeof error.suggestion === 'string' && (
                  <p className="mt-1 text-sm"> Sugerencia: {error.suggestion} </p>
                )}
                {error.code && typeof error.code === 'string' && (
                  <p className="mt-1 text-xs text-red-700">Código: {error.code}</p>
                )}
              </div>
            )}
          </div>{' '}
          {/* Fin Columna Izquierda */}
          {/* Columna Derecha: Previsualización y Acciones */}
          <div className="bg-white p-6 border rounded-lg shadow-md flex flex-col print:hidden sticky top-8 self-start">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Resultado</h2>

            {/* Área de Previsualización */}
            <div className="flex-grow flex items-center justify-center min-h-[200px] bg-gray-50 rounded border border-dashed border-gray-300 p-4 mb-6">
              {isLoading ? (
                <div className="text-center flex flex-col items-center text-gray-500">
                  {/* Spinner */}
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"
                    role="status"
                    aria-live="polite"
                  ></div>
                  <p>Generando código...</p>
                </div>
              ) : svgContent ? (
                <div
                  className="max-w-full max-h-[400px] overflow-auto [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <p className="text-gray-400">Aquí aparecerá la previsualización del código</p>
              )}
            </div>

            {/* Área de Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrint}
                disabled={!svgContent || isLoading}
                className="flex-1 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-100 disabled:transition-none"
              >
                {/* Icono Imprimir */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0M15.75 5.884l-8.25.825a2.25 2.25 0 0 1-2.176-1.671L4.5 3.75A2.25 2.25 0 0 1 6.728 1.5h10.544a2.25 2.25 0 0 1 2.228 2.25l-.162 1.463a2.25 2.25 0 0 1-2.176 1.67z"
                  />
                </svg>
                Imprimir
              </Button>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={!svgContent || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-green-300 disabled:text-green-500 disabled:cursor-not-allowed disabled:opacity-100 disabled:transition-none"
              >
                {/* Icono Descargar */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Descargar SVG
              </Button>
            </div>
          </div>
        </div>{' '}
        {/* Fin Grid */}
      </div>{' '}
      {/* Fin Contenedor Principal */}
      {/* Pie de página */}
      <footer className="mt-12 text-center text-sm text-gray-700 print:hidden">
        <p>CODEX - Plataforma de Generación de Códigos de Barras y QR</p>
        <p className="mt-1 text-xs">Versión 0.1.0 - Desarrollado con Next.js, Node.js y Rust</p>
      </footer>
    </main>
  );
}
