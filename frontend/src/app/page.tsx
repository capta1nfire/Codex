"use client"; // Necesario para usar hooks

import { useState } from 'react';

export default function Home() {
  // --- Estados Corregidos ---
  const [data, setData] = useState('');
  const [type, setType] = useState('qrcode');
  const [svgContent, setSvgContent] = useState(''); // <--- Renombrado para SVG
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // ---------------------------

  // --- handleGenerate Corregido ---
  const handleGenerate = async () => {
    if (!data) {
      setError('Por favor, introduce los datos a codificar.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSvgContent(''); // <-- Usa el setter correcto
    console.log('Frontend: Preparando fetch con:', { barcode_type: type, data: data });

    try {
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ barcode_type: type, data: data, options: {} }), // <-- Envía barcode_type
      });

      // Procesar respuesta (igual que antes)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor Node.js' }));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();

      // --- Verificación Corregida ---
      if (result.success && typeof result.svgString === 'string') { // <-- Espera svgString
        setSvgContent(result.svgString); // <-- Usa el setter correcto
      } else {
        throw new Error(result.error || 'Respuesta inválida recibida (se esperaba SVG).'); // Mensaje de error más específico
      }
      // --- Fin Verificación Corregida ---

    } catch (err) {
      console.error('Error en handleGenerate:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  // --- Fin handleGenerate Corregido ---

  // --- handleDownload Corregido para SVG ---
  const handleDownload = () => {
    if (!svgContent) return; // <-- Usa el estado correcto

    // Crear un Blob (objeto binario) desde el string SVG
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    // Crear una URL temporal para ese Blob
    const svgUrl = URL.createObjectURL(svgBlob);

    // Crear un enlace temporal
    const link = document.createElement('a');
    link.href = svgUrl;

    // Sugerir nombre de archivo con extensión .svg
    const safeDataSubstring = data.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_') || 'imagen';
    const filename = `codigo_${type}_${safeDataSubstring}.svg`; // <-- Extensión .svg
    link.download = filename;

    // Simular clic y limpiar
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar la URL del objeto después de un tiempo
    setTimeout(() => URL.revokeObjectURL(svgUrl), 100);
  };
  // --- Fin handleDownload Corregido ---

  // --- handlePrint (simple, sin cambios) ---
  const handlePrint = () => {
    window.print();
  };
  // --- Fin handlePrint ---

  // --- JSX Corregido ---
  return (
    <main className="flex min-h-screen flex-col items-center p-10 sm:p-24 gap-8 print:p-0"> {/* Quitar padding al imprimir */}

      <h1 className="text-3xl font-bold print:hidden">Generador de Códigos "CODEX"</h1>

      {/* Contenedor del Formulario (Oculto al imprimir) */}
      <div className="w-full max-w-md flex flex-col gap-4 p-6 border rounded-lg shadow-md print:hidden">
        {/* Campo de Datos */}
        <div className="flex flex-col">
          <label htmlFor="dataInput" className="mb-1 font-medium text-gray-700">Datos a Codificar:</label>
          <input
            type="text" id="dataInput" placeholder="Escribe los datos aquí..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data} onChange={(e) => setData(e.target.value)} disabled={isLoading}
          />
        </div>
        {/* Selector de Tipo */}
        <div className="flex flex-col">
          <label htmlFor="typeSelect" className="mb-1 font-medium text-gray-700">Tipo de Código:</label>
          <select
            id="typeSelect" value={type} onChange={(e) => setType(e.target.value)} disabled={isLoading}
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
        <button
          type="button" onClick={handleGenerate} disabled={isLoading}
          className={`px-4 py-2 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Generando...' : 'Generar Código'}
        </button>
      </div> {/* Fin Formulario */}

      {/* Área de Resultados Corregida */}
      <div className="w-full max-w-md mt-6 flex flex-col justify-start items-center border rounded-lg shadow-md p-4 min-h-[200px] bg-gray-50 gap-4 overflow-auto print:border-none print:shadow-none print:bg-white print:min-h-0 print:p-0 print:mt-0">
        {isLoading ? (
          <p className="text-blue-600 print:hidden">Generando código...</p> // Oculto al imprimir
        ) : error ? (
          <p className="text-red-600 font-semibold print:hidden">Error: {error}</p> // Oculto al imprimir
        ) : svgContent ? ( // <-- Verifica svgContent
          <>
            {/* Renderiza SVG directamente */}
            {/* Añadimos un div contenedor por si queremos limitar tamaño o centrar */}
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }} // <-- Muestra SVG
              className="max-w-full h-auto" // Ajusta tamaño según necesites
            />
            {/* Contenedor para botones (Oculto al imprimir) */}
            <div className="flex gap-4 mt-4 print:hidden">
              <button
                type="button" onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Descargar SVG {/* <-- Texto botón actualizado */}
              </button>
              <button
                type="button" onClick={handlePrint}
                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Imprimir
              </button>
            </div>
          </>
        ) : (
          // Estado inicial (Oculto al imprimir)
          <p className="text-gray-500 print:hidden">Aquí aparecerá el código generado...</p>
        )}
      </div>{/* Fin Área Resultados */}

    </main>
  );
}