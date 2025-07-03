/**
 * Componente DynamicQRCode - Implementación segura según el documento de referencia
 * 
 * Este componente implementa la técnica de escalado dinámico de QR codes
 * sin usar dangerouslySetInnerHTML, siguiendo las mejores prácticas de seguridad.
 * 
 * Requiere que el backend envíe datos estructurados en lugar de SVG crudo.
 * 
 * NOTA: Este archivo se moverá a generator/QRV3.tsx en la siguiente iteración
 */

import React, { useMemo } from 'react';

interface DynamicQRCodeProps {
  // Props esenciales - datos estructurados del backend
  pathData: string;        // El atributo 'd' del path SVG
  totalModules: number;    // El tamaño total incluyendo quiet zone
  size?: number;           // El tamaño del contenedor (default: 300)
  
  // Props opcionales para personalización
  color?: string;          // Color del QR (default: #000000)
  backgroundColor?: string; // Color de fondo (default: transparent)
  
  // Props para accesibilidad
  title?: string;
  description?: string;
  className?: string;
  
  // Props para estilos avanzados
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
}

const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({
  pathData,
  totalModules,
  size = 300,
  color = '#000000',
  backgroundColor = 'transparent',
  title,
  description,
  className,
  gradient
}) => {
  // Constante de la quiet zone según la especificación
  const QUIET_ZONE = 4;
  
  // Calculamos el viewBox usando la fórmula del documento
  const viewBox = useMemo(() => {
    // Validamos que totalModules sea válido
    if (isNaN(totalModules) || totalModules <= QUIET_ZONE * 2) {
      console.error('Invalid totalModules:', totalModules);
      // Retornamos un viewBox por defecto para evitar errores
      return '0 0 1 1';
    }
    
    // Debug log
    console.log('[DynamicQRCode] ViewBox calculation:', {
      totalModules,
      QUIET_ZONE,
      dataSize: totalModules - (2 * QUIET_ZONE)
    });
    
    // Fórmula del documento:
    // min-x = quietZone, min-y = quietZone
    // width = height = totalModules - (2 * quietZone)
    const dataSize = totalModules - (2 * QUIET_ZONE);
    return `${QUIET_ZONE} ${QUIET_ZONE} ${dataSize} ${dataSize}`;
  }, [totalModules]);
  
  // Generamos IDs únicos para accesibilidad
  const titleId = useMemo(() => 
    title ? `qr-title-${Math.random().toString(36).substr(2, 9)}` : undefined, 
    [title]
  );
  const descId = useMemo(() => 
    description ? `qr-desc-${Math.random().toString(36).substr(2, 9)}` : undefined, 
    [description]
  );
  
  // ID único para el gradiente si existe
  const gradientId = useMemo(() => 
    gradient ? `qr-gradient-${Math.random().toString(36).substr(2, 9)}` : undefined,
    [gradient]
  );
  
  // Calculamos el fill basado en si hay gradiente o no
  const fillValue = gradient && gradientId ? `url(#${gradientId})` : color;
  
  return (
    <div
      className={className}
      style={{ 
        width: size, 
        height: size,
        backgroundColor
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width="100%"
        height="100%"
        style={{ 
          display: 'block' // Eliminar espacio extra del inline SVG
        }}
        // preserveAspectRatio por defecto es "xMidYMid meet", que es lo que queremos
        // Lo incluimos explícitamente para mayor claridad según el documento
        preserveAspectRatio="xMidYMid meet"
        // Atributos de accesibilidad
        role="img"
        aria-labelledby={
          titleId && descId ? `${titleId} ${descId}` : 
          titleId ? titleId : 
          undefined
        }
      >
        {/* Elementos de accesibilidad */}
        {title && <title id={titleId}>{title}</title>}
        {description && <desc id={descId}>{description}</desc>}
        
        {/* Definiciones para gradientes si existen */}
        {gradient && gradientId && (
          <defs>
            {gradient.type === 'linear' ? (
              <linearGradient 
                id={gradientId}
                x1="0%" 
                y1="0%" 
                x2={gradient.angle === 0 ? "100%" : "0%"} 
                y2={gradient.angle === 90 ? "100%" : "0%"}
              >
                {gradient.colors.map((color, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (gradient.colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            ) : (
              <radialGradient id={gradientId}>
                {gradient.colors.map((color, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (gradient.colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </radialGradient>
            )}
          </defs>
        )}
        
        {/* El path del QR code */}
        <path
          d={pathData}
          fill={fillValue}
          // Atributo crucial para una renderización nítida del QR
          // según el documento, esto es innegociable
          shapeRendering="crispEdges"
        />
      </svg>
    </div>
  );
};

// Componente wrapper para usar con SVG string (migración gradual)
export const DynamicQRCodeFromSVG: React.FC<{
  svgContent: string;
  size?: number;
  className?: string;
  transparentBackground?: boolean;
}> = ({ svgContent, size = 300, className, transparentBackground = false }) => {
  // Extraemos pathData y totalModules del SVG string
  const { pathData, totalModules, backgroundColor } = useMemo(() => {
    if (!svgContent) return { pathData: '', totalModules: 0, backgroundColor: 'transparent' };
    
    console.log('[DynamicQRCodeFromSVG] transparentBackground prop:', transparentBackground);
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      const pathElement = doc.querySelector('path');
      
      // Si queremos fondo transparente, removemos el rect de fondo
      if (transparentBackground) {
        console.log('[DynamicQRCodeFromSVG] Removing background rectangles...');
        const rectElements = doc.querySelectorAll('rect');
        console.log('[DynamicQRCodeFromSVG] Found', rectElements.length, 'rect elements');
        
        rectElements.forEach(rect => {
          // Verificar si es el rect de fondo (generalmente el primero, con el tamaño completo)
          const x = rect.getAttribute('x') || '0';
          const y = rect.getAttribute('y') || '0';
          const width = rect.getAttribute('width');
          const height = rect.getAttribute('height');
          const fill = rect.getAttribute('fill');
          
          console.log('[DynamicQRCodeFromSVG] Rect:', { x, y, width, height, fill });
          
          if (x === '0' && y === '0') {
            console.log('[DynamicQRCodeFromSVG] Removing background rect');
            rect.remove();
          }
        });
      }
      
      // Buscar el color de fondo del rect si existe
      let bgColor = 'transparent';
      const backgroundRect = doc.querySelector('rect');
      if (backgroundRect && !transparentBackground) {
        bgColor = backgroundRect.getAttribute('fill') || '#FFFFFF';
      }
      
      if (!svgElement || !pathElement) {
        return { pathData: '', totalModules: 0, backgroundColor: bgColor };
      }
      
      // Extraemos el viewBox para obtener totalModules
      const viewBox = svgElement.getAttribute('viewBox');
      const pathD = pathElement.getAttribute('d');
      
      if (!viewBox || !pathD) {
        return { pathData: '', totalModules: 0 };
      }
      
      // ViewBox format: "min-x min-y width height"
      const viewBoxValues = viewBox.split(' ').map(Number);
      const [minX, minY, width, height] = viewBoxValues;
      
      // Debug log para ver qué valores estamos obteniendo
      console.log('[DynamicQRCodeFromSVG] ViewBox Debug:', {
        viewBox,
        viewBoxValues,
        minX,
        minY,
        width,
        height
      });
      
      // Para QR codes, totalModules incluye el quiet zone
      // Si minX y minY no son 0, significa que el viewBox ya considera el quiet zone
      const totalModules = minX === 0 ? width : width + (2 * minX);
      
      return {
        pathData: pathD,
        totalModules,
        backgroundColor: bgColor
      };
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return { pathData: '', totalModules: 0, backgroundColor: 'transparent' };
    }
  }, [svgContent, transparentBackground]);
  
  if (!pathData || !totalModules) {
    return null;
  }
  
  return (
    <DynamicQRCode
      pathData={pathData}
      totalModules={totalModules}
      size={size}
      className={className}
      backgroundColor={backgroundColor}
      title="Código QR"
      description="Escanea este código QR"
    />
  );
};

export default DynamicQRCode;