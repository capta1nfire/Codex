'use client';

import { useMemo } from 'react';

interface BarcodeDisplayProps {
  svgContent: string;
  type: string;
  data: string;
}

const typeLabels: Record<string, string> = {
  qrcode: 'QR Code',
  code128: 'Code 128',
  ean13: 'EAN-13',
  upca: 'UPC-A',
  code39: 'Code 39',
  pdf417: 'PDF417',
  datamatrix: 'Data Matrix',
};

export default function BarcodeDisplay({ svgContent, type, data }: BarcodeDisplayProps) {
  // SVG ya viene con gradientes aplicados desde el backend Rust
  const processedSvgContent = useMemo(() => svgContent || '', [svgContent]);

  // Calculamos clases de Tailwind condicionales para el contenedor/wrapper principal
  const wrapperClasses = useMemo(() => {
    // Clases base: Centrar contenido sin forzar altura completa
    const baseClasses = 'w-full flex flex-col items-center justify-center';
    
    return baseClasses;
  }, [type]);

  // Calculamos clases para el div que contiene el SVG interno
  const svgContainerClasses = useMemo(() => {
    // Clases base: Centrar el SVG y ocupar el espacio necesario
    const baseClasses = 'flex justify-center items-center';
    const isLinearBarcode = ['code128', 'ean13', 'upca', 'code39'].includes(type);

    if (isLinearBarcode) {
      // Para lineales: mantener aspecto pero ocupar ancho necesario
      return `${baseClasses} w-full min-h-[150px]`;
    } else {
      // Para QR y otros 2D: ocupar el espacio necesario
      return `${baseClasses}`;
    }
  }, [type]);

  // Función para añadir el texto del código debajo (si aplica)
  const renderTextLabel = () => {
    // Mostramos texto para más tipos si es relevante, ajusta según necesidad
    if (['ean13', 'upca', 'code39', 'code128'].includes(type)) {
      const displayText = data && data.length > 50 ? data.substring(0, 47) + '...' : data || ''; // Acortar si es muy largo
      return (
        // Texto más oscuro para contraste
        <div className="mt-2 text-sm font-mono text-center text-gray-800 break-all w-full px-1">
          {displayText}
        </div>
      );
    }
    return null;
  };

  // Función para añadir información del tipo de código
  const renderTypeInfo = () => {
    return (
      // Texto más oscuro para contraste
      <div className="mt-1 text-xs text-gray-700 font-medium">
        {typeLabels[type] || (type ? type.toUpperCase() : 'BARCODE')}
      </div>
    );
  };

  // --- Renderizado del Componente ---
  return (
    // Aplicamos las clases calculadas al div contenedor principal
    <div className={wrapperClasses}>
      {/* Div que contiene directamente el SVG */}
      <div
        className={svgContainerClasses}
        dangerouslySetInnerHTML={{ __html: processedSvgContent }}
        role="img"
        aria-label={`Código ${typeLabels[type] || type} generado para los datos: ${data ? data.substring(0, 30) : ''}${data && data.length > 30 ? '...' : ''}`}
      />
      <style jsx>{`
        div :global(svg) {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
      `}</style>
      {/* Mostramos etiquetas debajo */}
      {renderTextLabel()}
      {renderTypeInfo()}
    </div>
  );
}