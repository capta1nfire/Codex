"use client"; // Necesario para usar hooks como useState y manejar eventos

import { useState } from 'react';
import { Disclosure } from '@headlessui/react'; // <-- Importamos Disclosure

export default function Home() {
  // --- Estados ---
  const [data, setData] = useState('');
  const [type, setType] = useState('qrcode');
  const [svgContent, setSvgContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [scale, setScale] = useState<number>(3); // <-- Estado para Escala (default 3)

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!data) {
      setError('Por favor, introduce los datos a codificar.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSvgContent('');

    // --- Añadimos la escala a las opciones ---
    const options = { scale: scale };
    console.log('Frontend: Preparando fetch con:', { barcode_type: type, data: data, options: options });
    // -----------------------------------------

    try {
      // Llamada al backend Node.js (sin cambios aquí)
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({
          barcode_type: type,
          data: data,
          options: options // <-- Enviamos el objeto options (que ahora contiene scale)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor Node.js' }));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }
      const result = await response.json();

      if (result.success && typeof result.svgString === 'string') {
        setSvgContent(result.svgString);
      } else {
        throw new Error(result.error || 'Respuesta inválida recibida (se esperaba SVG).');
      }
    } catch (err) {
      console.error('Error en handleGenerate:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
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
    const filename = `codigo_${type}_${safeDataSubstring}_escala${scale}.svg`; // <-- Añadido escala al nombre
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- JSX ---
  return (
    <main className="flex min-h-screen flex-col items-center p-10 sm:p-24 gap-6 sm:gap-8 print:p-0"> {/* Ajustado gap */}

      <h1 className="text-3xl font-bold print:hidden">Generador de Códigos "CODEX"</h1>

      {/* --- Formulario Principal --- */}
      <div className="w-full max-w-md flex flex-col gap-4 p-6 border rounded-lg shadow-md print:hidden">
         {/* Input Datos */}
         <div className="flex flex-col">
           <label htmlFor="dataInput" className="mb-1 font-medium text-gray-700">Datos a Codificar:</label>
           <input type="text" id="dataInput" placeholder="Escribe los datos aquí..."
             className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             value={data} onChange={(e) => setData(e.target.value)} disabled={isLoading} />
         </div>
         {/* Select Tipo */}
         <div className="flex flex-col">
           <label htmlFor="typeSelect" className="mb-1 font-medium text-gray-700">Tipo de Código:</label>
           <select id="typeSelect" value={type} onChange={(e) => setType(e.target.value)} disabled={isLoading}
             className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
             <option value="qrcode">QR Code</option>
             <option value="code128">Code 128</option>
             <option value="pdf417">PDF417</option>
             <option value="ean13">EAN-13</option>
             <option value="upca">UPC-A</option>
             <option value="code39">Code 39</option>
             <option value="datamatrix">Data Matrix</option>
           </select>
         </div>
         {/* Botón Generar */}
         <button type="button" onClick={handleGenerate} disabled={isLoading}
           className={`w-full px-4 py-2 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${ isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700' }`}
         >
           {isLoading ? 'Generando...' : 'Generar Código'}
         </button>
      </div> {/* Fin Formulario Principal */}

      {/* --- Sección de Personalización (Acordeón Headless UI) --- */}
      <div className="w-full max-w-md print:hidden">
        <Disclosure>
          {({ open }) => (
            <div className="border rounded-lg shadow-md"> {/* Contenedor del Disclosure */}
              <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-t-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                <span>Opciones de Personalización</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transform transition-transform ${open ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </Disclosure.Button>
              {/* Añadimos una transición suave */}
              <Disclosure.Panel className="px-4 pt-4 pb-4 text-sm text-gray-700 bg-white rounded-b-lg transition-all duration-300 ease-in-out">
                 <div className="space-y-4">
                    {/* --- Grupo Apariencia --- */}
                    <fieldset className="border p-4 rounded border-gray-300">
                      <legend className="font-semibold text-sm px-1 text-gray-600">Apariencia</legend>
                      <div className="flex flex-col gap-4 pt-2">
                        {/* Opción Escala */}
                        <div>
                          <label htmlFor="scaleRange" className="block text-sm font-medium mb-1 flex justify-between">
                            <span>Escala (Tamaño Módulo):</span>
                            <span className="font-mono text-blue-700 text-xs">{scale}</span> {/* Muestra valor actual */}
                          </label>
                          <input
                            type="range" // Usamos slider
                            id="scaleRange"
                            min="1"    // Mínimo
                            max="10"   // Máximo (ajustable)
                            step="1"   // Incremento
                            value={scale}
                            onChange={(e) => setScale(Number(e.target.value))} // Actualiza estado 'scale'
                            disabled={isLoading}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" // Estilo slider
                          />
                        </div>
                        {/* TODO: Añadir controles para Color FG/BG aquí */}
                      </div>
                    </fieldset>

                    {/* TODO: Añadir fieldset para Visualización (Texto, Quiet Zone) */}
                    {/* TODO: Añadir fieldset para Opciones Avanzadas (ECL, etc.) */}
                 </div>
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      </div>
      {/* --- FIN Sección Personalización --- */}


      {/* --- Área de Resultados (igual que antes, maneja svgContent) --- */}
      <div className="w-full max-w-md mt-6 flex flex-col justify-start items-center border rounded-lg shadow-md p-4 min-h-[200px] bg-gray-50 gap-4 overflow-auto print:border-none print:shadow-none print:bg-white print:min-h-0 print:p-0 print:mt-0">
        {isLoading ? ( <p className="text-blue-600 print:hidden">Generando código...</p> )
         : error ? ( <p className="text-red-600 font-semibold print:hidden">Error: {error}</p> )
         : svgContent ? (
            <>
              <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full max-w-[300px] sm:max-w-[400px]" /> {/* Muestra SVG */}
              {/* Botones (Download ahora usa handleDownload actualizado) */}
              <div className="flex gap-4 mt-4 print:hidden">
                 <button type="button" onClick={handleDownload} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Descargar SVG</button>
                 <button type="button" onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Imprimir</button>
              </div>
            </>
          ) : ( <p className="text-gray-500 print:hidden">Aquí aparecerá el código generado...</p> )}
      </div>{/* Fin Área Resultados */}

    </main>
  );
}