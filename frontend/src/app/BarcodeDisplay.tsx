'use client';

import { useMemo } from 'react';

interface BarcodeDisplayProps {
  svgContent: string;
  type: string;
  data: string;
  // Quitamos 'scale' de las props, ya no se usa para el display CSS
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
  // Calculamos clases de Tailwind condicionales para el contenedor/wrapper principal
  const wrapperClasses = useMemo(() => {
    // Clases base: Añadimos padding, fondo blanco suave, borde, sombra, centrado
    const baseClasses =
      'p-4 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center w-full';
    const isLinearBarcode = ['code128', 'ean13', 'upca', 'code39'].includes(type);
    const isPdf417 = type === 'pdf417';

    if (isLinearBarcode) {
      // Permitimos que los lineales sean más anchos
      return `${baseClasses} max-w-2xl lg:max-w-4xl`;
    } else if (isPdf417) {
      // Ancho intermedio para PDF417
      return `${baseClasses} max-w-xl lg:max-w-2xl`;
    } else {
      // QR, DataMatrix: SIN restricción de ancho máximo para dominio visual
      return `${baseClasses}`;
    }
  }, [type]);

  // Calculamos clases para el div que contiene el SVG interno
  const svgContainerClasses = useMemo(() => {
    // Clases base: Centrado, padding interno para que no toque bordes
    const baseClasses = 'w-full flex justify-center items-center p-2';
    const isLinearBarcode = ['code128', 'ean13', 'upca', 'code39'].includes(type);

    if (isLinearBarcode) {
      // Para lineales: altura automática pero con máximo para mantener proporción visual
      return `${baseClasses} h-auto min-h-24 max-h-32`;
    } else {
      // Para QR y otros 2D: altura más generosa para dominancia visual
      return `${baseClasses} h-auto min-h-48 lg:min-h-64`;
    }
  }, [type]);

  // Función para añadir el texto del código debajo (si aplica)
  const renderTextLabel = () => {
    // Mostramos texto para más tipos si es relevante, ajusta según necesidad
    if (['ean13', 'upca', 'code39', 'code128'].includes(type)) {
      const displayText = data.length > 50 ? data.substring(0, 47) + '...' : data; // Acortar si es muy largo
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
        {typeLabels[type] || type.toUpperCase()}
      </div>
    );
  };

  // --- Renderizado del Componente ---
  return (
    // Aplicamos las clases calculadas al div contenedor principal
    // Este div ahora tiene fondo blanco, borde, sombra, padding
    <div className={wrapperClasses}>
      {/* Div que contiene directamente el SVG */}
      <div
        className={svgContainerClasses} // <-- Clases para tamaño/aspecto
        dangerouslySetInnerHTML={{ __html: svgContent }}
        role="img"
        // Usamos un título más descriptivo para accesibilidad
        aria-label={`Código ${typeLabels[type] || type} generado para los datos: ${data.substring(0, 30)}${data.length > 30 ? '...' : ''}`}
      />
      {/* Mostramos etiquetas debajo */}
      {renderTextLabel()}
      {renderTypeInfo()}
    </div>
  );
}
