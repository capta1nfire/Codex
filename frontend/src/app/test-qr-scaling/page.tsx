'use client';

import React, { useState } from 'react';
import DynamicQRCode, { DynamicQRCodeFromSVG } from '@/components/DynamicQRCode';
import BarcodeDisplayV2 from '@/app/BarcodeDisplayV2';

// SVG de ejemplo con quiet zone de 4 módulos
const EXAMPLE_SVG_25x25 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" width="264" height="264">
  <rect width="33" height="33" fill="#ffffff"/>
  <path d="M4 4h1v1H4zM5 4h1v1H5zM6 4h1v1H6zM7 4h1v1H7zM8 4h1v1H8zM9 4h1v1H9zM10 4h1v1H10zM12 4h1v1H12zM13 4h1v1H13zM14 4h1v1H14zM15 4h1v1H15zM17 4h1v1H17zM18 4h1v1H18zM19 4h1v1H19zM22 4h1v1H22zM23 4h1v1H23zM24 4h1v1H24zM25 4h1v1H25zM26 4h1v1H26zM27 4h1v1H27zM28 4h1v1H28zM4 5h1v1H4zM10 5h1v1H10zM12 5h1v1H12zM17 5h1v1H17zM19 5h1v1H19zM22 5h1v1H22zM28 5h1v1H28zM4 6h1v1H4zM6 6h1v1H6zM7 6h1v1H7zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM13 6h1v1H13zM15 6h1v1H15zM17 6h1v1H17zM19 6h1v1H19zM22 6h1v1H22zM24 6h1v1H24zM25 6h1v1H25zM26 6h1v1H26zM28 6h1v1H28z" fill="#000000"/>
</svg>`;

// Path data extraído del SVG (simulando lo que vendría del backend)
const EXAMPLE_PATH_DATA = "M4 4h1v1H4zM5 4h1v1H5zM6 4h1v1H6zM7 4h1v1H7zM8 4h1v1H8zM9 4h1v1H9zM10 4h1v1H10zM12 4h1v1H12zM13 4h1v1H13zM14 4h1v1H14zM15 4h1v1H15zM17 4h1v1H17zM18 4h1v1H18zM19 4h1v1H19zM22 4h1v1H22zM23 4h1v1H23zM24 4h1v1H24zM25 4h1v1H25zM26 4h1v1H26zM27 4h1v1H27zM28 4h1v1H28zM4 5h1v1H4zM10 5h1v1H10zM12 5h1v1H12zM17 5h1v1H17zM19 5h1v1H19zM22 5h1v1H22zM28 5h1v1H28zM4 6h1v1H4zM6 6h1v1H6zM7 6h1v1H7zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM13 6h1v1H13zM15 6h1v1H15zM17 6h1v1H17zM19 6h1v1H19zM22 6h1v1H22zM24 6h1v1H24zM25 6h1v1H25zM26 6h1v1H26zM28 6h1v1H28z";

export default function TestQRScalingPage() {
  const [showOriginal, setShowOriginal] = useState(true);
  const [containerSize, setContainerSize] = useState(300);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test de Escalado QR Ultrathink</h1>
        
        {/* Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Controles</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className={`px-4 py-2 rounded ${showOriginal ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {showOriginal ? 'Original (con márgenes)' : 'Optimizado (ultrathink)'}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <label>Tamaño del contenedor:</label>
            <input
              type="range"
              min="200"
              max="500"
              value={containerSize}
              onChange={(e) => setContainerSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono">{containerSize}px</span>
          </div>
        </div>
        
        {/* Comparación lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Original (viewBox sin modificar)
            </h3>
            <div 
              className="border-2 border-dashed border-gray-300 mx-auto"
              style={{ width: containerSize, height: containerSize }}
            >
              <div dangerouslySetInnerHTML={{ __html: EXAMPLE_SVG_25x25 }} />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              viewBox="0 0 33 33" - Incluye quiet zone de 4 módulos
            </p>
          </div>
          
          {/* Optimizado con componente seguro */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Optimizado con DynamicQRCode (Seguro)
            </h3>
            <div 
              className="border-2 border-dashed border-gray-300 mx-auto"
              style={{ width: containerSize, height: containerSize }}
            >
              <DynamicQRCode
                pathData={EXAMPLE_PATH_DATA}
                totalModules={33}
                size={containerSize}
                title="Código QR de prueba"
                description="Este es un código QR optimizado con la técnica ultrathink"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              viewBox="4 4 25 25" - Recortado dinámicamente
            </p>
          </div>
          
          {/* Optimizado desde SVG string */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Optimizado con DynamicQRCodeFromSVG
            </h3>
            <div 
              className="border-2 border-dashed border-gray-300 mx-auto"
              style={{ width: containerSize, height: containerSize }}
            >
              <DynamicQRCodeFromSVG
                svgContent={EXAMPLE_SVG_25x25}
                size={containerSize}
                className="qr-test"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Extrae pathData y totalModules del SVG automáticamente
            </p>
          </div>
          
          {/* BarcodeDisplayV2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              BarcodeDisplayV2 (con procesamiento)
            </h3>
            <div 
              className="border-2 border-dashed border-gray-300 mx-auto flex items-center justify-center"
              style={{ width: containerSize, height: containerSize }}
            >
              <BarcodeDisplayV2
                svgContent={EXAMPLE_SVG_25x25}
                type="qrcode"
                data="https://example.com"
                containerSize={containerSize}
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Procesa el SVG on-the-fly con DOMParser
            </p>
          </div>
        </div>
        
        {/* Información técnica */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Información Técnica</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>🎯 Quiet Zone: 4 módulos (hardcoded en backend)</p>
            <p>📐 QR Data: 25x25 módulos</p>
            <p>📦 Total con quiet zone: 33x33 módulos</p>
            <p>✂️ Fórmula viewBox: `4 4 25 25` (recorta los márgenes)</p>
            <p>🔍 shape-rendering: crispEdges (bordes nítidos)</p>
            <p>📏 preserveAspectRatio: xMidYMid meet (escala automático)</p>
          </div>
        </div>
        
        {/* Notas de implementación */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-2">⚠️ Notas de Seguridad</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>El documento recomienda NUNCA usar dangerouslySetInnerHTML</li>
            <li>La implementación ideal recibe pathData y totalModules como JSON</li>
            <li>DynamicQRCodeFromSVG es una solución de transición</li>
            <li>El backend debería enviar datos estructurados, no SVG raw</li>
          </ul>
        </div>
      </div>
    </div>
  );
}