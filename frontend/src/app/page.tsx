"use client"; // Necesario para usar hooks como useState y manejar eventos

import { useState } from 'react';

export default function Home() {
  // Estados para los datos del formulario
  const [data, setData] = useState('');
  const [type, setType] = useState('qrcode'); // Valor inicial 'qrcode'

  // Estados para el resultado y la interfaz
  const [imageDataUrl, setImageDataUrl] = useState(''); // Guarda la imagen Base64
  const [isLoading, setIsLoading] = useState(false); // Indica si se está generando
  const [error, setError] = useState(''); // Guarda mensajes de error

  // --- NUEVA FUNCIÓN ---
  // Función que se ejecuta al hacer clic en el botón "Generar Código"
  const handleGenerate = async () => {
    // 1. Validar entrada (simple)
    if (!data) {
      setError('Por favor, introduce los datos a codificar.');
      return; // Detiene la ejecución si no hay datos
    }

    // 2. Preparar para la llamada API
    setIsLoading(true); // Activa el indicador de carga
    setError(''); // Limpia errores anteriores
    setImageDataUrl(''); // Limpia imagen anterior

    try {
      // 3. Llamar a la API del backend
      const response = await fetch('http://localhost:3001/generate', { // URL del backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type, // Valor del estado 'type'
          data: data, // Valor del estado 'data'
          options: {}, // Por ahora enviamos opciones vacías, podríamos añadirlas luego
        }),
      });

      // 4. Procesar la respuesta del backend
      if (!response.ok) {
        // Si la respuesta no fue exitosa (ej. error 400, 500)
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido del servidor' })); // Intenta leer el error JSON, si falla, pone uno genérico
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json(); // Lee la respuesta JSON exitosa

      if (result.success && result.imageDataUrl) {
        // 5. Éxito: Guardar la imagen Base64 en el estado
        setImageDataUrl(result.imageDataUrl);
      } else {
        // Si success es false o falta imageDataUrl
        throw new Error(result.error || 'La respuesta del servidor no fue válida.');
      }

    } catch (err) {
      // 6. Manejar errores (de red o del backend)
      console.error('Error al llamar a la API:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(errorMessage); // Guarda el mensaje de error en el estado

    } finally {
      // 7. Se ejecuta siempre al final (éxito o error)
      setIsLoading(false); // Desactiva el indicador de carga
    }
  };
  // --- FIN NUEVA FUNCIÓN ---

// --- Añade esta función ---
const handleDownload = () => {
  if (!imageDataUrl) return; // No hacer nada si no hay imagen

  // Crear un enlace temporal
  const link = document.createElement('a');
  // Establecer el href del enlace a la imagen Base64
  link.href = imageDataUrl;

  // Crear un nombre de archivo sugerido (ej. codigo_qrcode_datos.png)
  // Tomamos los primeros 15 caracteres de los datos para el nombre
  const safeDataSubstring = data.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_') || 'imagen'; // Limpia caracteres no seguros
  const filename = `codigo_${type}_${safeDataSubstring}.png`;
  link.download = filename; // Atributo 'download' sugiere el nombre al navegador

  // Añadir el enlace al DOM (necesario en algunos navegadores)
  document.body.appendChild(link);
  // Simular un clic en el enlace para iniciar la descarga
  link.click();
  // Eliminar el enlace temporal del DOM
  document.body.removeChild(link);
};
// --- Fin de la función ---

// Prueba para detectar cambios en Git

  // El JSX que se renderiza
  return (
    <main className="flex min-h-screen flex-col items-center p-10 sm:p-24 gap-8">

      <h1 className="text-3xl font-bold">Generador de Códigos "CODEX"</h1>

      {/* Contenedor del Formulario */}
      <div className="w-full max-w-md flex flex-col gap-4 p-6 border rounded-lg shadow-md">

        {/* Campo de Datos - Ahora conectado al estado */}
        <div className="flex flex-col">
          <label htmlFor="dataInput" className="mb-1 font-medium text-gray-700">Datos a Codificar:</label>
          <input
            type="text"
            id="dataInput"
            placeholder="Escribe los datos aquí..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={data}
            onChange={(e) => setData(e.target.value)} // Actualiza el estado 'data'
            disabled={isLoading} // Deshabilita mientras carga
          />
        </div>

        {/* Selector de Tipo de Código - Ahora conectado al estado */}
        <div className="flex flex-col">
          <label htmlFor="typeSelect" className="mb-1 font-medium text-gray-700">Tipo de Código:</label>
          <select
            id="typeSelect"
            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={type}
            onChange={(e) => setType(e.target.value)} // Actualiza el estado 'type'
            disabled={isLoading} // Deshabilita mientras carga
          >
            <option value="qrcode">QR Code</option>
            <option value="code128">Code 128</option>
            <option value="pdf417">PDF417</option>
            {/* TODO: Añadir más tipos aquí */}
          </select>
        </div>

        {/* Botón de Generar - Ahora conectado a la función handleGenerate */}
        <button
          type="button"
          className={`px-4 py-2 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700' // Cambia estilo si está cargando
          }`}
          onClick={handleGenerate} // <<--- Llama a handleGenerate al hacer clic
          disabled={isLoading} // Deshabilita el botón si está cargando
        >
          {isLoading ? 'Generando...' : 'Generar Código'} {/* Cambia texto si está cargando */}
        </button>

      </div> {/* Fin Contenedor Formulario */}

      {/* Área para mostrar la imagen generada y botón de descarga */}
  <div className="w-full max-w-md mt-6 flex flex-col justify-center items-center border rounded-lg shadow-md p-4 min-h-[200px] bg-gray-50 gap-4"> {/* Añadimos flex-col y gap */}
    {isLoading ? (
      <p className="text-blue-600">Generando código...</p>
    ) : error ? (
      <p className="text-red-600 font-semibold">Error: {error}</p>
    ) : imageDataUrl ? (
      // Si hay imagen, muestra la imagen Y el botón
      <> {/* Fragmento para agrupar elementos */}
        <img src={imageDataUrl} alt={`Código ${type} generado`} className="max-w-full h-auto" />
        <button
          type="button"
          onClick={handleDownload} // <--- Llama a la nueva función
          className="mt-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Descargar PNG
        </button>
      </>
    ) : (
      // Estado inicial
      <p className="text-gray-500">Aquí aparecerá el código generado...</p>
    )}
  </div>

    </main>
  );
}