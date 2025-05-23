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
      return `${baseClasses} max-w-xl md:max-w-2xl`;
    } else if (isPdf417) {
      // Ancho intermedio para PDF417
      return `${baseClasses} max-w-md lg:max-w-lg`;
    } else {
      // QR, DataMatrix: Ancho más contenido para mantener forma cuadrada
      // Ajusta estos valores si quieres que sean más grandes/pequeños
      return `${baseClasses} max-w-xs sm:max-w-sm md:max-w-md`;
    }
  }, [type]);

  // Calculamos clases para el div que contiene el SVG interno
  const svgContainerClasses = useMemo(() => {
    // Clases base: Centrado, padding interno para que no toque bordes
    const baseClasses = 'w-full flex justify-center items-center p-2';
    const isLinearBarcode = ['code128', 'ean13', 'upca', 'code39'].includes(type);

    if (isLinearBarcode) {
      // Para lineales: altura automática pero con máximo para mantener proporción visual
      // Puedes ajustar este valor max-h-xx (ej. max-h-24 = 6rem = 96px)
      // Un valor más grande (ej. max-h-32) hará el código más alto pero más estrecho
      return `${baseClasses} h-auto max-h-24 sm:max-h-28`;
    } else {
      // Para QR y otros 2D: altura automática, el ancho ya limitado por wrapperClasses
      return `${baseClasses} h-auto`;
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
