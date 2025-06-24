/**
 * QRLogoMask Component - Máscara SVG para zona de exclusión de logo
 * 
 * Crea una máscara SVG que define la zona donde el logo será colocado,
 * permitiendo que el QR code tenga un "agujero" real en esa área.
 * Esto es parte de la implementación de exclusión nativa de zona.
 * 
 * Características:
 * - Máscara dinámica basada en el tamaño y forma del logo
 * - Soporte para formas: cuadrado, círculo, cuadrado redondeado
 * - Integración con zonas intocables para preservar patrones funcionales
 * - Optimización de rendimiento con memoización
 */

import React, { useMemo } from 'react';

export interface LogoMaskProps {
  // ID único para la máscara
  maskId: string;
  
  // Tamaño total del QR (incluyendo quiet zone)
  totalModules: number;
  
  // Tamaño de datos del QR (sin quiet zone)
  dataModules: number;
  
  // Quiet zone
  quietZone: number;
  
  // Configuración del logo
  logoSize: number; // Como ratio (0.0 - 0.3)
  logoShape: 'square' | 'circle' | 'rounded-square';
  
  // Zonas intocables opcionales
  untouchableZones?: Array<{
    zone_type: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export const QRLogoMask: React.FC<LogoMaskProps> = ({
  maskId,
  totalModules,
  dataModules,
  quietZone,
  logoSize,
  logoShape,
  untouchableZones = [],
}) => {
  // Calcular dimensiones del logo en módulos
  const logoSizeInModules = useMemo(() => {
    return dataModules * logoSize;
  }, [dataModules, logoSize]);
  
  // Calcular posición central del logo
  const logoPosition = useMemo(() => {
    const centerX = dataModules / 2;
    const centerY = dataModules / 2;
    const halfSize = logoSizeInModules / 2;
    
    return {
      x: centerX - halfSize,
      y: centerY - halfSize,
      width: logoSizeInModules,
      height: logoSizeInModules,
    };
  }, [dataModules, logoSizeInModules]);
  
  // Generar path para la forma del logo
  const logoPath = useMemo(() => {
    const { x, y, width, height } = logoPosition;
    
    switch (logoShape) {
      case 'circle':
        // Círculo centrado
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = width / 2;
        return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;
        
      case 'rounded-square':
        // Cuadrado con esquinas redondeadas (10% del tamaño)
        const radius = width * 0.1;
        return `
          M ${x + radius} ${y}
          L ${x + width - radius} ${y}
          Q ${x + width} ${y} ${x + width} ${y + radius}
          L ${x + width} ${y + height - radius}
          Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
          L ${x + radius} ${y + height}
          Q ${x} ${y + height} ${x} ${y + height - radius}
          L ${x} ${y + radius}
          Q ${x} ${y} ${x + radius} ${y}
          Z
        `.trim();
        
      case 'square':
      default:
        // Cuadrado simple
        return `M ${x} ${y} h ${width} v ${height} h -${width} Z`;
    }
  }, [logoPosition, logoShape]);
  
  // ID único para el clip path de zonas intocables
  const clipPathId = `${maskId}-untouchable`;
  
  return (
    <>
      {/* Definir clip path para zonas intocables si existen */}
      {untouchableZones.length > 0 && (
        <clipPath id={clipPathId}>
          {/* Área completa del QR */}
          <rect x="0" y="0" width={dataModules} height={dataModules} />
          
          {/* Excluir zonas intocables de la máscara */}
          {untouchableZones.map((zone, index) => (
            <rect
              key={`untouchable-${index}`}
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              fill="black"
            />
          ))}
        </clipPath>
      )}
      
      {/* Máscara principal */}
      <mask id={maskId}>
        {/* Fondo blanco = área visible del QR */}
        <rect
          x="0"
          y="0"
          width={totalModules}
          height={totalModules}
          fill="white"
        />
        
        {/* Área negra = zona excluida para el logo */}
        <g transform={`translate(${quietZone}, ${quietZone})`}>
          <path
            d={logoPath}
            fill="black"
            clipPath={untouchableZones.length > 0 ? `url(#${clipPathId})` : undefined}
          />
        </g>
      </mask>
    </>
  );
};

// Componente para renderizar información de depuración de zonas intocables
export const UntouchableZonesDebug: React.FC<{
  zones: Array<{
    zone_type: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  quietZone: number;
}> = ({ zones, quietZone }) => {
  const colors: Record<string, string> = {
    FinderPattern: 'rgba(255, 0, 0, 0.3)',
    Separator: 'rgba(255, 128, 0, 0.3)',
    TimingPattern: 'rgba(0, 255, 0, 0.3)',
    AlignmentPattern: 'rgba(0, 0, 255, 0.3)',
    FormatInfo: 'rgba(255, 0, 255, 0.3)',
    VersionInfo: 'rgba(255, 255, 0, 0.3)',
    QuietZone: 'rgba(128, 128, 128, 0.1)',
  };
  
  return (
    <g className="untouchable-zones-debug" transform={`translate(${quietZone}, ${quietZone})`}>
      {zones.map((zone, index) => (
        <rect
          key={`zone-debug-${index}`}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={colors[zone.zone_type] || 'rgba(0, 0, 0, 0.2)'}
          stroke={colors[zone.zone_type]?.replace('0.3', '0.8') || 'rgba(0, 0, 0, 0.5)'}
          strokeWidth="0.1"
          pointerEvents="none"
        >
          <title>{zone.zone_type}</title>
        </rect>
      ))}
    </g>
  );
};

export default QRLogoMask;