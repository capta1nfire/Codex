"use client"; // Necesario para usar hooks como useState y manejar eventos

import { useState } from 'react';
import { Disclosure } from '@headlessui/react'; // Importamos Disclosure
// import { Input } from "@/components/ui/input"; // Eliminado - No usado
import { Label } from "@/components/ui/label"; // Importar Label
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select
import { Button } from "@/components/ui/button"; // Importar Button

// Interfaz para el error estructurado devuelto por el backend
interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
}

export default function Home() {
  // --- Estados ---
  const [data, setData] = useState('');
  const [type, setType] = useState('qrcode');
  const [svgContent, setSvgContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [scale, setScale] = useState<number>(3);
  const [errorLevel, setErrorLevel] = useState<string>('');

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!data) {
      setError({ success: false, error: 'Por favor, introduce los datos a codificar.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setSvgContent('');

    const options: Record<string, any> = { scale };
    if (type === 'qrcode' && errorLevel) {
      options.error_correction_level = errorLevel;
    }

    console.log('Frontend: Preparando fetch con:', { barcode_type: type, data, options });

    try {
      // Usar la variable de entorno para la URL del backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`; // Construct URL
      console.log("FETCHING URL:", requestUrl); // Log the exact URL
      const response = await fetch(requestUrl, { // Use the constructed URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode_type: type,
          data: data,
          options: options
        }),
      });

      const result = await response.json();

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
        console.log("ERROR set in !response.ok:", JSON.stringify(newErrorState, null, 2));
        setError(newErrorState);
        console.log("DEBUG: setError called from !response.ok. New state:", JSON.stringify(newErrorState, null, 2));
        return;
      }

      if (result.success && typeof result.svgString === 'string') {
        setSvgContent(result.svgString);
        setError(null);
        console.log("DEBUG: setError(null) llamado desde éxito.");
      } else {
        const errorObj = (result && typeof result.error === 'object' && result.error !== null) ? result.error : {}; 
        const errorMsg = typeof result.error === 'string' ? result.error : (typeof errorObj.message === 'string' ? errorObj.message : 'Respuesta inválida recibida (se esperaba SVG).');
        const newErrorState = { success: false, error: errorMsg };
        console.log("ERROR set in success=false/invalid SVG:", JSON.stringify(newErrorState, null, 2));
        setError(newErrorState);
        console.log("DEBUG: setError llamado desde else (success false o svgString inválido). Nuevo estado:", JSON.stringify(newErrorState, null, 2));
      }
    } catch (err) {
      console.error('Error en handleGenerate:', err);
      const errorMsg = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Ocurrió un error inesperado.');
      const newErrorState = { success: false, error: errorMsg };
      console.log("ERROR set in catch(err):", JSON.stringify(newErrorState, null, 2));
      setError(newErrorState);
      console.log("DEBUG: setError llamado desde catch(err). Nuevo estado:", JSON.stringify(newErrorState, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

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
    window.print();
  };

  const showErrorCorrection = type === 'qrcode';
  const showHeightOption = !['qrcode', 'datamatrix'].includes(type); // Ejemplo: visible para 1D y PDF417

  // Return normal
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 print:p-0 bg-gray-100 text-gray-900">
      <h1 className="text-3xl font-bold mb-8 print:hidden text-gray-900">
        Generador de Códigos "CODEX..."
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
                <Label htmlFor="dataInput" className="block mb-1.5 text-sm font-medium text-gray-800">
                  Datos a Codificar:
                </Label>
                <textarea id="dataInput" placeholder="Escribe los datos aquí..."
                  rows={4} // Altura inicial del textarea
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={data} onChange={(e) => setData(e.target.value)} disabled={isLoading}/>
                {/* Ayuda contextual */}
                <div className="mt-1.5 text-xs text-gray-600 min-h-[1.2em]"> {/* Placeholder para altura */} 
                  {type === 'ean13' && (<span>Exactamente 12 dígitos numéricos (checksum automático)</span> )}
                  {type === 'upca' && (<span>Exactamente 11 dígitos numéricos</span> )}
                  {/* Añadir más hints aquí */} 
                </div>
              </div>
              {/* Tipo de Código: Select */}
              <div className="mb-4">
                <Label htmlFor="typeSelect" className="block mb-1.5 text-sm font-medium text-gray-800">
                  Tipo de Código:
                </Label>
                <Select value={type} onValueChange={setType} disabled={isLoading}>
                  <SelectTrigger id="typeSelect">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qrcode">QR Code</SelectItem>
                    <SelectItem value="code128">Code 128</SelectItem>
                    <SelectItem value="pdf417">PDF417</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                    <SelectItem value="upca">UPC-A</SelectItem>
                    <SelectItem value="code39">Code 39</SelectItem>
                    <SelectItem value="datamatrix">Data Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Botón Generar */}
              <Button type="button" onClick={handleGenerate} disabled={isLoading} className="w-full text-base py-2.5">
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
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`} >
                         <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /> 
                      </svg>
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-6 py-4 border-t border-gray-200 bg-white text-sm text-gray-800">
                      <div className="space-y-6"> {/* Aumentamos el espacio entre fieldsets */} 
                        {/* Fieldset: Apariencia */}
                        <fieldset className="space-y-4">
                          <legend className="text-base font-semibold mb-2 text-gray-900">Apariencia</legend>
                          <div>
                            <Label htmlFor="scaleRange" className="block text-sm font-medium mb-1 flex justify-between text-gray-800">
                              <span>Escala (Tamaño):</span>
                              <span className="font-mono text-blue-700 text-xs">{scale}</span>
                            </Label>
                            <input type="range" id="scaleRange" min="1" max="10" step="1" value={scale} onChange={(e) => setScale(Number(e.target.value))} disabled={isLoading}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </div>
                          {/* Aquí irían inputs de color si fueran necesarios */}
                        </fieldset>

                        {/* Fieldset: Visualización (Condicional) */} 
                        {showHeightOption && (
                          <fieldset className="space-y-4 pt-4 border-t border-gray-200">
                            <legend className="text-base font-semibold mb-2 text-gray-900">Visualización (Códigos 1D)</legend>
                            {/* Aquí irían opciones como 'Mostrar Texto', 'Altura' */}
                            <p className="text-xs text-gray-500">(Opciones como Altura y Mostrar Texto irían aquí)</p>
                          </fieldset>
                        )}

                        {/* Fieldset: Avanzado (Específico por Tipo) */}
                        {showErrorCorrection && (
                          <fieldset className="space-y-4 pt-4 border-t border-gray-200">
                            <legend className="text-base font-semibold mb-2 text-gray-900">Avanzado (QR Code)</legend>
                            <div>
                              <Label htmlFor="errorCorrectionLevel" className="block text-sm font-medium mb-1 text-gray-800">
                                Nivel de Corrección de Errores (ECL):
                              </Label>
                              <Select value={errorLevel} onValueChange={setErrorLevel} disabled={isLoading}>
                                <SelectTrigger id="errorCorrectionLevel">
                                  <SelectValue placeholder="Predeterminado (M)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="L">L - Bajo (7%)</SelectItem>
                                  <SelectItem value="M">M - Medio (15%)</SelectItem>
                                  <SelectItem value="Q">Q - Cuartil (25%)</SelectItem>
                                  <SelectItem value="H">H - Alto (30%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </fieldset>
                        )}
                      </div>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            </div>

            {/* Área de Errores - Revertida a la versión con typeof checks */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{typeof error.error === 'string' ? error.error : 'Ocurrió un error.'}</span>
                {/* Restablecer code y suggestion con verificación */} 
                {error.suggestion && typeof error.suggestion === 'string' && (
                   <p className="mt-1 text-sm"> Sugerencia: {error.suggestion} </p> 
                )}
                {error.code && typeof error.code === 'string' && (
                   <p className="mt-1 text-xs text-red-700">Código: {error.code}</p> 
                )}
              </div>
            )}
          </div> {/* Fin Columna Izquierda */}

          {/* Columna Derecha: Previsualización y Acciones */}
          <div className="flex flex-col">
            {/* Tarjeta: Previsualización */}
            <div className="bg-white p-6 border rounded-lg shadow-md flex flex-col items-center justify-center h-full min-h-[350px] print:border-none print:shadow-none print:p-0 print:bg-transparent">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 print:hidden">Previsualización</h2>
              <div className="flex-grow flex items-center justify-center w-full print:block print:w-auto print:h-auto print:flex-grow-0">
                {isLoading ? ( <p className="text-blue-600 animate-pulse print:hidden">Generando código...</p> )
                 : error ? ( <p className="text-red-600 print:hidden">Error al generar. Revisa la configuración.</p> )
                 : svgContent ? (
                    // Contenedor del SVG - Ahora más adaptable
                    <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl print:max-w-full print:w-full" />
                  ) : (
                    <div className="text-center text-gray-500 print:hidden">
                      <p className="mb-1">Aquí aparecerá el código generado.</p>
                      <p className="text-sm">Introduce datos y haz clic en "Generar".</p>
                    </div>
                  )}
                </div>
              {/* Botones de Acción (solo si hay SVG) */} 
              {svgContent && !isLoading && !error && (
                <div className="flex gap-4 mt-6 print:hidden">
                  <Button type="button" variant="secondary" onClick={handleDownload}>Descargar SVG</Button>
                  <Button type="button" variant="outline" onClick={handlePrint}>Imprimir</Button>
                </div>
              )}
            </div>
          </div> {/* Fin Columna Derecha */} 
          
        </div> {/* Fin Grid */}
      </div> {/* Fin Contenedor Principal */} 

      {/* Pie de página */}
      <footer className="mt-12 text-center text-sm text-gray-700 print:hidden">
        <p>CODEX - Plataforma de Generación de Códigos de Barras y QR</p>
        <p className="mt-1 text-xs">Versión 0.1.0 - Desarrollado con Next.js, Node.js y Rust</p>
      </footer>
    </main>
  );
}