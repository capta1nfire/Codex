'use client';

import { useMemo } from 'react';

interface BarcodeDisplayV2Props {
  svgContent: string;
  type: string;
  data: string;
  containerSize?: number; // Tamaño del contenedor (default: 300)
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

/**
 * Componente mejorado para mostrar códigos de barras con escalado dinámico de QR
 * Implementa la técnica de recorte virtual con viewBox según el documento de referencia
 */
export default function BarcodeDisplayV2({ 
  svgContent, 
  type, 
  data,
  containerSize = 300 
}: BarcodeDisplayV2Props) {
  
  const isQRCode = type === 'qrcode' || type === 'qr';
  
  // Procesamos el SVG para QR codes aplicando la técnica del documento
  const processedSvgContent = useMemo(() => {
    if (!svgContent) return '';
    
    // Para códigos QR, aplicamos la técnica de recorte virtual
    if (isQRCode) {
      try {
        // Parseamos el SVG para extraer y modificar el viewBox
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (!svgElement) return svgContent;
        
        // Extraemos el viewBox original
        const originalViewBox = svgElement.getAttribute('viewBox');
        if (!originalViewBox) return svgContent;
        
        // Parseamos los valores del viewBox original
        const [, , width] = originalViewBox.split(' ').map(Number);
        
        // El backend incluye una quiet zone de 4 módulos
        const QUIET_ZONE = 4;
        
        // Calculamos el nuevo viewBox que recorta la quiet zone
        // según la fórmula del documento:
        // newViewBox = `${quietZone} ${quietZone} ${totalModules - 2*quietZone} ${totalModules - 2*quietZone}`
        const dataSize = width - (2 * QUIET_ZONE);
        const newViewBox = `${QUIET_ZONE} ${QUIET_ZONE} ${dataSize} ${dataSize}`;
        
        // Aplicamos el nuevo viewBox
        svgElement.setAttribute('viewBox', newViewBox);
        
        // Establecemos width y height para llenar el contenedor
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        
        // Aseguramos que preserveAspectRatio esté configurado correctamente
        // El valor por defecto "xMidYMid meet" es exactamente lo que necesitamos
        if (!svgElement.hasAttribute('preserveAspectRatio')) {
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        
        // Aplicamos shape-rendering="crispEdges" a todos los paths
        // Esto es crítico para la legibilidad del QR
        const paths = doc.querySelectorAll('path, rect');
        paths.forEach(path => {
          path.setAttribute('shape-rendering', 'crispEdges');
        });
        
        // Serializamos el SVG modificado
        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
        
      } catch (error) {
        console.error('Error processing QR SVG:', error);
        return svgContent;
      }
    }
    
    // Para otros tipos de código de barras, retornamos sin modificar
    return svgContent;
  }, [svgContent, isQRCode]);

  // Clases del contenedor principal
  const wrapperClasses = useMemo(() => {
    return 'w-full flex flex-col items-center justify-center';
  }, []);

  // Clases para el contenedor del SVG
  const svgContainerClasses = useMemo(() => {
    const baseClasses = 'flex justify-center items-center';
    const isLinearBarcode = ['code128', 'ean13', 'upca', 'code39'].includes(type);

    if (isQRCode) {
      // Para QR: contenedor fijo exacto
      return `${baseClasses} qr-container`;
    } else if (isLinearBarcode) {
      // Para lineales: mantener aspecto pero ocupar ancho necesario
      return `${baseClasses} w-full min-h-[150px]`;
    } else {
      // Para otros 2D: ocupar el espacio necesario
      return `${baseClasses}`;
    }
  }, [type, isQRCode]);

  // Función para añadir el texto del código debajo (si aplica)
  const renderTextLabel = () => {
    if (['ean13', 'upca', 'code39', 'code128'].includes(type)) {
      const displayText = data && data.length > 50 ? data.substring(0, 47) + '...' : data || '';
      return (
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
      <div className="mt-1 text-xs text-gray-700 font-medium">
        {typeLabels[type] || (type ? type.toUpperCase() : 'BARCODE')}
      </div>
    );
  };

  return (
    <div className={wrapperClasses}>
      {/* Contenedor del SVG */}
      <div
        className={svgContainerClasses}
        dangerouslySetInnerHTML={{ __html: processedSvgContent }}
        role="img"
        aria-label={`Código ${typeLabels[type] || type} generado para los datos: ${data ? data.substring(0, 30) : ''}${data && data.length > 30 ? '...' : ''}`}
        style={isQRCode ? {
          width: `${containerSize}px`,
          height: `${containerSize}px`,
          overflow: 'hidden'
        } : {}}
      />
      
      {/* Estilos específicos */}
      <style jsx>{`
        /* Para QR codes, aplicamos estilos especiales */
        .qr-container :global(svg) {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
        
        /* Para otros códigos de barras */
        div :global(svg:not(.qr-container svg)) {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
        
        /* Estilos de impresión según el documento */
        @media print {
          .qr-container :global(svg path),
          .qr-container :global(svg rect) {
            fill: #000000 !important;
            shape-rendering: crispEdges !important;
          }
          
          /* Ocultar otros elementos en impresión */
          body * {
            visibility: hidden;
          }
          .qr-container,
          .qr-container * {
            visibility: visible;
          }
          .qr-container {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
      
      {/* Etiquetas debajo */}
      {renderTextLabel()}
      {renderTypeInfo()}
    </div>
  );
}