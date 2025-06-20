/**
 * UltrathinkQR Component - CODEX v3 Implementation
 * 
 * Renderiza códigos QR sin márgenes visuales (ultrathink) usando datos
 * estructurados del backend v3. Implementa la técnica de recorte virtual
 * con viewBox según el documento de referencia.
 * 
 * Características:
 * - Seguro: No usa dangerouslySetInnerHTML
 * - Eficiente: Renderizado directo con React
 * - Accesible: Soporte completo ARIA
 * - Imprimible: Estilos optimizados para impresión
 */

import React, { useMemo } from 'react';
import { QRStructuredData } from '@/hooks/useQRGenerationV3';

interface UltrathinkQRProps {
  // Datos estructurados del backend v3
  data: QRStructuredData;
  
  // Tamaño del contenedor en píxeles
  size?: number;
  
  // Personalización visual
  color?: string;
  backgroundColor?: string;
  
  // Accesibilidad
  title?: string;
  description?: string;
  
  // Clases CSS adicionales
  className?: string;
  
  // Callback cuando el QR es clickeado
  onClick?: () => void;
}

export const UltrathinkQR: React.FC<UltrathinkQRProps> = ({
  data,
  size = 300,
  color = '#000000',
  backgroundColor = 'transparent',
  title = 'Código QR',
  description,
  className = '',
  onClick,
}) => {
  // Constante de quiet zone del backend
  const QUIET_ZONE = data.metadata.quiet_zone;
  
  // Calcular viewBox usando la fórmula ULTRATHINK
  // viewBox = "quietZone quietZone dataModules dataModules"
  const viewBox = useMemo(() => {
    if (!data.data_modules || data.data_modules <= 0) {
      console.error('Invalid data_modules:', data.data_modules);
      return '0 0 1 1'; // Fallback seguro
    }
    
    // La fórmula clave del documento:
    // Recortar desde quietZone hasta quietZone + dataModules
    return `${QUIET_ZONE} ${QUIET_ZONE} ${data.data_modules} ${data.data_modules}`;
  }, [data.data_modules, QUIET_ZONE]);
  
  // IDs únicos para accesibilidad
  const titleId = useMemo(() => 
    `qr-title-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );
  const descId = useMemo(() => 
    description ? `qr-desc-${Math.random().toString(36).substr(2, 9)}` : undefined, 
    [description]
  );
  
  // Información de debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('UltrathinkQR render:', {
      totalModules: data.total_modules,
      dataModules: data.data_modules,
      quietZone: QUIET_ZONE,
      viewBox,
      version: data.version,
    });
  }
  
  return (
    <div
      className={`ultrathink-qr-container ${className}`}
      style={{ 
        width: size, 
        height: size,
        backgroundColor,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width="100%"
        height="100%"
        // preserveAspectRatio por defecto es "xMidYMid meet"
        // que es exactamente lo que necesitamos según el documento
        preserveAspectRatio="xMidYMid meet"
        // Atributos de accesibilidad
        role="img"
        aria-labelledby={descId ? `${titleId} ${descId}` : titleId}
      >
        {/* Elementos de accesibilidad */}
        <title id={titleId}>{title}</title>
        {description && <desc id={descId}>{description}</desc>}
        
        {/* Path del QR con shape-rendering crítico */}
        <path
          d={data.path_data}
          fill={color}
          // shape-rendering="crispEdges" es INNEGOCIABLE
          // según el documento para mantener legibilidad
          shapeRendering="crispEdges"
        />
      </svg>
      
      {/* Estilos inline para garantizar comportamiento */}
      <style jsx>{`
        .ultrathink-qr-container {
          display: inline-block;
          line-height: 0;
        }
        
        .ultrathink-qr-container svg {
          display: block;
        }
        
        /* Estilos de impresión según documento */
        @media print {
          .ultrathink-qr-container svg path {
            fill: #000000 !important;
            shape-rendering: crispEdges !important;
          }
          
          .ultrathink-qr-container {
            background-color: white !important;
          }
        }
        
        /* Animación sutil para interactividad */
        .ultrathink-qr-container[role="button"]:hover {
          opacity: 0.9;
          transition: opacity 0.2s ease;
        }
        
        .ultrathink-qr-container[role="button"]:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

/**
 * Componente de carga mientras se genera el QR
 */
export const UltrathinkQRSkeleton: React.FC<{ size?: number }> = ({ size = 300 }) => (
  <div
    className="ultrathink-qr-skeleton"
    style={{ 
      width: size, 
      height: size,
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      className="shimmer"
      style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'shimmer 1.5s infinite',
      }}
    />
    <style jsx>{`
      @keyframes shimmer {
        to {
          left: 100%;
        }
      }
    `}</style>
  </div>
);

/**
 * Componente compuesto con estado de carga integrado
 */
export const UltrathinkQRWithState: React.FC<{
  data: QRStructuredData | null;
  isLoading: boolean;
  error: string | null;
  size?: number;
  onRetry?: () => void;
}> = ({ data, isLoading, error, size = 300, onRetry }) => {
  if (isLoading) {
    return <UltrathinkQRSkeleton size={size} />;
  }
  
  if (error) {
    return (
      <div
        style={{ 
          width: size, 
          height: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#dc2626', marginBottom: '10px' }}>
          Error al generar QR
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }
  
  if (!data) {
    return null;
  }
  
  return <UltrathinkQR data={data} size={size} />;
};

export default UltrathinkQR;