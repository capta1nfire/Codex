"use client"; // Necesario para usar hooks como useState y manejar eventos

import { useState } from 'react';
import { Disclosure } from '@headlessui/react'; // Importamos Disclosure

// Interfaz para el error estructurado devuelto por el backend
interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
  details?: Array<{
    msg: string;
    param: string;
    location: string;
    value?: string;
  }>;
}

// Modal componente
function HealthModal({ isOpen, onClose, healthData }: { isOpen: boolean; onClose: () => void; healthData: any }) {
  if (!isOpen || !healthData) return null;

  // Calcular tiempo activo
  const minutes = Math.floor(healthData.uptime / 60);
  const seconds = Math.floor(healthData.uptime % 60);
  
  // Determinar colores para estado
  const getStatusColor = (status: string) => {
    return status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Estado del Sistema</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Estado general - ahora con el mismo estilo que las otras secciones */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-2">API Gateway</h4>
            <div className="flex items-center">
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData.status)}`}>
                {healthData.status.toUpperCase()}
              </div>
              <span className="ml-2 text-xs text-gray-500">{healthData.service}</span>
            </div>
          </div>
          
          {/* Servicio Rust - mantiene su estilo */}
          {healthData.dependencies?.rust_service && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-2">Servicio Rust</h4>
              <div className="flex items-center">
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(healthData.dependencies.rust_service.status)}`}>
                  {healthData.dependencies.rust_service.status.toUpperCase()}
                </div>
                <span className="ml-2 text-xs text-gray-500">servicio-generador</span>
                {healthData.dependencies.rust_service.error && (
                  <span className="ml-2 text-xs text-red-500">{healthData.dependencies.rust_service.error}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Información del sistema - ahora con el mismo fondo que los otros */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-2">Información del Sistema</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Tiempo activo:</div>
              <div className="font-mono">{minutes}m {seconds}s</div>
              
              {healthData.memoryUsage && (
                <>
                  <div className="text-gray-500">Memoria (proceso):</div>
                  <div className="font-mono">{healthData.memoryUsage.processUsage}</div>
                  
                  <div className="text-gray-500">Memoria total:</div>
                  <div className="font-mono">{healthData.memoryUsage.total}</div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
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
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [healthInfo, setHealthInfo] = useState<any>(null);

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
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_type: type, data: data, options: options }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Validación mejorada para detalles de error
        const errorData: ErrorResponse = {
          success: false,
          error: result.error || 'Error desconocido',
          details: result.details
        };
        
        // Formatear un mensaje más amigable si hay detalles de validación
        if (result.details && Array.isArray(result.details) && result.details.length > 0) {
          // Formar una sugerencia basada en los errores de validación
          const validationMessages = result.details
            .map((detail: {msg: string; param: string; location: string; value?: string}) => 
              `${detail.msg} (${detail.param})`)
            .join('. ');
          
          errorData.suggestion = `Por favor corrija los siguientes problemas: ${validationMessages}`;
        }
        
        setError(errorData);
        return;
      }

      if (result.success && typeof result.svgString === 'string') {
        setSvgContent(result.svgString);
      } else {
        setError({ success: false, error: result.error || 'Respuesta inválida recibida (se esperaba SVG).' });
      }
    } catch (err) {
      console.error('Error en handleGenerate:', err);
      setError({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
        suggestion: 'Verifique su conexión a internet y que el servidor backend esté funcionando correctamente.'
      });
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

  const testBackendConnection = async () => {
    try {
      console.log('Probando conexión con el backend...');
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
      });
      
      if (response.ok) {
        const healthData = await response.json();
        console.log('✅ Conexión exitosa con el backend:', healthData);
        
        // En lugar de alert, usamos el modal
        setHealthInfo(healthData);
        setIsHealthModalOpen(true);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ El backend respondió con error:', errorText);
        alert(`Error ${response.status}: El backend respondió con un error`);
        return false;
      }
    } catch (error) {
      console.error('❌ No se pudo conectar con el backend:', error);
      alert('Error: No se pudo conectar con el backend. Verifica que esté en ejecución.');
      return false;
    }
  };

  const showErrorCorrection = type === 'qrcode';

  // --- JSX ---
  return (
    // Cambiado a un fondo gris muy claro para toda la página y texto base más oscuro
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 print:p-0 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 print:hidden text-gray-900"> {/* Texto del título más oscuro */}
        Generador de Códigos "CODEX"
      </h1>

      {/* Layout de dos columnas */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 print:block">
        {/* Columna izquierda: Formulario y Opciones */}
        <div className="space-y-6 print:hidden">
          {/* Formulario Principal */}
          {/* Usamos texto más oscuro para labels y hints */}
          <div className="bg-white p-6 border rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Configuración</h2>
            {/* Input Datos */}
            <div className="mb-4">
              <label htmlFor="dataInput" className="block mb-1 font-medium text-gray-800"> {/* <-- Más oscuro */}
                Datos a Codificar:
              </label>
              <input type="text" id="dataInput" placeholder="Escribe los datos aquí..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={data} onChange={(e) => setData(e.target.value)} disabled={isLoading}/>
              {/* Ayuda contextual */}
              {type === 'ean13' && ( <p className="text-xs text-gray-700 mt-1"> {/* <-- Más oscuro */}
                  Exactamente 12 dígitos numéricos (el dígito de verificación se calcula automáticamente) </p> )}
              {type === 'upca' && ( <p className="text-xs text-gray-700 mt-1"> {/* <-- Más oscuro */}
                  Exactamente 11 dígitos numéricos </p> )}
            </div>
            {/* Select Tipo */}
            <div className="mb-4">
              <label htmlFor="typeSelect" className="block mb-1 font-medium text-gray-800"> {/* <-- Más oscuro */}
                Tipo de Código:
              </label>
              <select id="typeSelect" value={type} onChange={(e) => setType(e.target.value)} disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              className={`w-full px-4 py-2 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${ isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700' }`}>
              {isLoading ? 'Generando...' : 'Generar Código'}
            </button>

            {/* Botón para probar la conexión */}
            <button type="button" onClick={testBackendConnection} className="mt-2 w-full px-4 py-2 border border-blue-500 text-blue-600 font-semibold rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Probar Conexión Backend
            </button>
          </div>

          {/* Sección de Personalización */}
          {/* Usamos texto más oscuro para legend y label */}
          <div className="bg-white border rounded-lg shadow-md overflow-hidden">
            <Disclosure>
              {({ open }) => (
                <div>
                  <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-sm font-medium text-left text-blue-900 bg-blue-100 hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span>Opciones de Personalización</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transform transition-transform ${open ? 'rotate-180' : ''}`} >
                       <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /> </svg>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-4 bg-white transition-all duration-300 ease-in-out text-gray-800"> {/* <-- Texto base más oscuro */}
                    <div className="space-y-4">
                      <fieldset className="border p-4 rounded border-gray-300">
                        <legend className="font-semibold text-sm px-1 text-gray-700">Apariencia</legend> {/* <-- Más oscuro */}
                        <div className="flex flex-col gap-4 pt-2">
                          <div>
                            <label htmlFor="scaleRange" className="block text-sm font-medium mb-1 flex justify-between text-gray-800"> {/* <-- Más oscuro */}
                              <span>Escala (Tamaño Módulo):</span>
                              <span className="font-mono text-blue-700 text-xs">{scale}</span>
                            </label>
                            <input type="range" id="scaleRange" min="1" max="10" step="1" value={scale} onChange={(e) => setScale(Number(e.target.value))} disabled={isLoading}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                          </div>
                          {/* TODO: Colores */}
                        </div>
                      </fieldset>

                      {showErrorCorrection && (
                        <fieldset className="border p-4 rounded border-gray-300">
                          <legend className="font-semibold text-sm px-1 text-gray-700">Opciones Avanzadas (QR)</legend> {/* <-- Más oscuro */}
                          <div className="flex flex-col gap-4 pt-2">
                            <div>
                              <label htmlFor="errorCorrectionLevel" className="block text-sm font-medium mb-1 text-gray-800"> {/* <-- Más oscuro */}
                                Nivel de Corrección de Errores:
                              </label>
                              <select id="errorCorrectionLevel" value={errorLevel} onChange={(e) => setErrorLevel(e.target.value)} disabled={isLoading}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Predeterminado (M)</option>
                                <option value="L">L - Bajo (7%)</option>
                                <option value="M">M - Medio (15%)</option>
                                <option value="Q">Q - Cuartil (25%)</option>
                                <option value="H">H - Alto (30%)</option>
                              </select>
                            </div>
                          </div>
                        </fieldset>
                      )}
                      {/* TODO: Otros fieldsets */}
                    </div>
                  </Disclosure.Panel>
                  </div>
              )}
            </Disclosure>
          </div>

          {/* Mostrar error con formato mejorado */}
          {/* Usamos texto base más oscuro */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-900"> {/* Error más oscuro */}
              <h3 className="font-semibold">Error:</h3>
              <p>{error.error}</p>
              {error.suggestion && ( 
                <p className="mt-2 text-sm text-red-800"> {/* Más oscuro */}
                  <span className="font-medium">Sugerencia:</span> {error.suggestion} 
                </p> 
              )}
              {error.details && error.details.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Detalles de validación:</h4>
                  <ul className="text-xs space-y-1 list-disc pl-5">
                    {error.details.map((detail, index) => (
                      <li key={index}>
                        <span className="font-medium">{detail.param}:</span> {detail.msg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {error.code && ( <p className="mt-1 text-xs text-gray-600">Código: {error.code}</p> )} {/* Mantenemos gris */}
            </div>
          )}
        </div>

        {/* Columna derecha: Previsualización */}
        <div className="flex flex-col">
          {/* Usamos texto más oscuro y placeholder más oscuro */}
          <div className="bg-white p-6 border rounded-lg shadow-md flex flex-col items-center justify-center h-full min-h-[320px] print:border-none print:shadow-none print:p-0">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 print:hidden">Previsualización</h2>
            {isLoading ? ( <p className="text-blue-600 animate-pulse print:hidden">Generando código...</p> )
             : error ? null // Error ya se muestra en columna izquierda
             : svgContent ? (
                <div className="flex flex-col items-center w-full">
                  <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full max-w-[300px] sm:max-w-[400px]" />
                  <div className="flex gap-4 mt-6 print:hidden">
                    <button type="button" onClick={handleDownload} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Descargar SVG</button>
                    <button type="button" onClick={handlePrint} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">Imprimir</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 print:hidden">
                  <p className="text-gray-700 mb-2">Aquí aparecerá el código generado...</p> {/* <-- Más oscuro */}
                  <p className="text-sm text-gray-500">Selecciona un tipo, introduce datos y haz clic en "Generar Código"</p> {/* <-- Más oscuro */}
                </div>
              )}
          </div>
        </div>
      </div> {/* Fin Grid */}

      {/* Modal de estado del sistema */}
      <HealthModal 
        isOpen={isHealthModalOpen} 
        onClose={() => setIsHealthModalOpen(false)}
        healthData={healthInfo}
      />

      {/* Pie de página */}
      {/* Usamos texto más oscuro */}
      <footer className="mt-10 text-center text-sm text-gray-700 print:hidden"> {/* <-- Más oscuro */}
        <p>CODEX - Plataforma de Generación de Códigos de Barras y QR</p>
        <p className="mt-1">Versión 0.1.0 - Desarrollado con Next.js, Node.js y Rust</p>
      </footer>
    </main>
  );
}