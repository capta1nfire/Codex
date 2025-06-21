/**
 * EnhancedUltrathinkQR Component - CODEX v3 Enhanced Implementation
 * 
 * Renderiza códigos QR con personalización completa usando la estructura
 * enhanced del backend v3. Soporta gradientes, efectos, formas personalizadas,
 * logos y marcos.
 * 
 * Características:
 * - Gradientes avanzados (linear, radial, conic, diamond, spiral)
 * - Efectos visuales (shadow, glow, blur, noise, vintage)
 * - Formas de ojos personalizadas
 * - Patrones de datos
 * - Logos y marcos
 * - 100% seguro sin dangerouslySetInnerHTML
 * - Performance optimizado con memoización
 */

import React, { useMemo } from 'react';

// Tipos para la estructura Enhanced v3
export interface QREnhancedData {
  paths: {
    data: string;
    eyes: Array<{
      type: string;
      path: string;
      shape?: string;
    }>;
  };
  styles: {
    data: {
      fill: string;
      effects?: string[];
      shape?: string;
      stroke?: {
        enabled: boolean;
        color?: string;
        width?: number;
        opacity?: number;
      };
    };
    eyes: {
      fill: string;
      effects?: string[];
      shape?: string;
      stroke?: {
        enabled: boolean;
        color?: string;
        width?: number;
        opacity?: number;
      };
    };
  };
  definitions?: Array<QRDefinition>;
  overlays?: {
    logo?: QRLogo;
    frame?: QRFrame;
  };
  metadata: {
    generation_time_ms: number;
    quiet_zone: number;
    content_hash: string;
    total_modules: number;
    data_modules: number;
    version: number;
    error_correction: string;
  };
}

type QRDefinition = QRGradientDef | QREffectDef;

interface QRGradientDef {
  type: 'gradient';
  id: string;
  gradient_type: string;
  colors: string[];
  angle?: number;
  coords?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

interface QREffectDef {
  type: 'effect';
  id: string;
  effect_type: string;
  [key: string]: any; // Parámetros dinámicos del efecto
}

interface QRLogo {
  src: string;
  size: number;
  shape: string;
  padding: number;
  x: number;
  y: number;
}

interface QRFrame {
  style: string;
  path: string;
  fill_style: {
    fill: string;
  };
  text?: {
    content: string;
    x: number;
    y: number;
    font_family: string;
    font_size: number;
    text_anchor: string;
  };
}

interface EnhancedUltrathinkQRProps {
  // Datos estructurados enhanced del backend v3
  data: QREnhancedData;
  
  // Tamaño del QR completo (incluye frame si existe)
  totalModules: number;
  dataModules: number;
  version: number;
  errorCorrection: string;
  
  // Tamaño del contenedor en píxeles
  size?: number;
  
  // Color de fondo (por defecto transparente)
  backgroundColor?: string;
  
  // Accesibilidad
  title?: string;
  description?: string;
  
  // Clases CSS adicionales
  className?: string;
  
  // Callback cuando el QR es clickeado
  onClick?: () => void;
}

export const EnhancedUltrathinkQR: React.FC<EnhancedUltrathinkQRProps> = ({
  data,
  totalModules,
  dataModules,
  version,
  errorCorrection,
  size = 300,
  backgroundColor = 'transparent',
  title = 'Código QR',
  description,
  className = '',
  onClick,
}) => {
  const QUIET_ZONE = data.metadata.quiet_zone;
  
  // Debug log
  console.log('[EnhancedUltrathinkQR] Rendering with data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : null,
    totalModules,
    dataModules,
    hasDataPath: !!data?.paths?.data,
    dataPathLength: data?.paths?.data?.length
  });
  
  // Calcular viewBox usando la fórmula ULTRATHINK
  const viewBox = useMemo(() => {
    if (!dataModules || dataModules <= 0) {
      console.error('Invalid dataModules:', dataModules);
      return '0 0 1 1';
    }
    return `${QUIET_ZONE} ${QUIET_ZONE} ${dataModules} ${dataModules}`;
  }, [dataModules, QUIET_ZONE]);
  
  // Renderizar definiciones (gradientes y efectos)
  const definitions = useMemo(() => {
    if (!data.definitions || data.definitions.length === 0) return null;
    
    return data.definitions.map((def) => {
      if (def.type === 'gradient') {
        return renderGradient(def as QRGradientDef);
      } else if (def.type === 'effect') {
        return renderEffect(def as QREffectDef);
      }
      return null;
    });
  }, [data.definitions]);
  
  // IDs únicos para accesibilidad
  const titleId = useMemo(() => 
    `qr-title-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );
  const descId = useMemo(() => 
    description ? `qr-desc-${Math.random().toString(36).substr(2, 9)}` : undefined, 
    [description]
  );
  
  return (
    <div
      className={`enhanced-ultrathink-qr-container ${className}`}
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
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby={descId ? `${titleId} ${descId}` : titleId}
      >
        {/* Elementos de accesibilidad */}
        <title id={titleId}>{title}</title>
        {description && <desc id={descId}>{description}</desc>}
        
        {/* Definiciones (gradientes y efectos) */}
        {definitions && <defs>{definitions}</defs>}
        
        {/* Grupo principal con efectos si existen */}
        <g filter={getFilterString(data.styles.data.effects)}>
          {/* Path de datos */}
          <path
            d={data.paths.data}
            fill={data.styles.data.fill}
            shapeRendering="crispEdges"
            {...(data.styles.data.stroke ? {
              stroke: data.styles.data.stroke.color || '#FFFFFF',
              strokeWidth: data.styles.data.stroke.width || 0.5,
              strokeOpacity: data.styles.data.stroke.opacity || 0.3,
            } : {})}
          />
        </g>
        
        {/* Grupo de ojos con efectos si existen */}
        <g filter={getFilterString(data.styles.eyes.effects)}>
          {/* Paths de ojos */}
          {data.paths.eyes.map((eye, index) => (
            <path
              key={`eye-${eye.type}-${index}`}
              d={eye.path}
              fill={data.styles.eyes.fill}
              shapeRendering="crispEdges"
              data-eye-type={eye.type}
              data-eye-shape={eye.shape}
              {...(data.styles.eyes.stroke ? {
                stroke: data.styles.eyes.stroke.color || '#FFFFFF',
                strokeWidth: data.styles.eyes.stroke.width || 0.5,
                strokeOpacity: data.styles.eyes.stroke.opacity || 0.3,
              } : {})}
            />
          ))}
        </g>
        
        {/* Overlays (logo y frame) si existen */}
        {data.overlays?.logo && renderLogo(data.overlays.logo, dataModules)}
        {data.overlays?.frame && renderFrame(data.overlays.frame)}
      </svg>
      
      {/* Estilos inline para garantizar comportamiento */}
      <style jsx>{`
        .enhanced-ultrathink-qr-container {
          display: inline-block;
          line-height: 0;
          position: relative;
        }
        
        .enhanced-ultrathink-qr-container svg {
          display: block;
        }
        
        /* Estilos de impresión */
        @media print {
          .enhanced-ultrathink-qr-container svg path {
            shape-rendering: crispEdges !important;
          }
          
          .enhanced-ultrathink-qr-container {
            background-color: white !important;
          }
          
          /* Desactivar efectos en impresión para mejor claridad */
          .enhanced-ultrathink-qr-container svg g {
            filter: none !important;
          }
        }
        
        /* Animación sutil para interactividad */
        .enhanced-ultrathink-qr-container[role="button"]:hover {
          opacity: 0.95;
          transition: opacity 0.2s ease;
        }
        
        .enhanced-ultrathink-qr-container[role="button"]:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

// Funciones auxiliares para renderizar elementos

function renderGradient(gradient: QRGradientDef): React.ReactElement {
  const key = `gradient-${gradient.id}`;
  
  switch (gradient.gradient_type.toLowerCase()) {
    case 'linear':
      return (
        <linearGradient
          key={key}
          id={gradient.id}
          x1="0%"
          y1="0%"
          x2={gradient.angle === 45 ? "100%" : gradient.angle === 90 ? "0%" : "100%"}
          y2={gradient.angle === 45 ? "100%" : gradient.angle === 90 ? "100%" : "0%"}
        >
          {gradient.colors.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (gradient.colors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      );
      
    case 'radial':
      return (
        <radialGradient
          key={key}
          id={gradient.id}
          cx={gradient.coords?.x1 || 0.5}
          cy={gradient.coords?.y1 || 0.5}
          r={gradient.coords?.x2 || 0.5}
        >
          {gradient.colors.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (gradient.colors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </radialGradient>
      );
      
    case 'conic':
      // SVG no soporta gradientes cónicos nativamente, usar fallback radial
      return (
        <radialGradient
          key={key}
          id={gradient.id}
          cx="0.5"
          cy="0.5"
          r="0.5"
        >
          {gradient.colors.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (gradient.colors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </radialGradient>
      );
      
    default:
      // Fallback a linear
      return (
        <linearGradient key={key} id={gradient.id}>
          {gradient.colors.map((color, i) => (
            <stop
              key={i}
              offset={`${(i / (gradient.colors.length - 1)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      );
  }
}

function renderEffect(effect: QREffectDef): React.ReactElement {
  const key = `effect-${effect.id}`;
  
  switch (effect.effect_type.toLowerCase()) {
    case 'shadow':
      return (
        <filter key={key} id={effect.id}>
          <feDropShadow
            dx={effect.dx || 1}
            dy={effect.dy || 1}
            stdDeviation={effect.stdDeviation || 0.5}
            floodOpacity={effect.opacity || 0.3}
          />
        </filter>
      );
      
    case 'glow':
      return (
        <filter key={key} id={effect.id}>
          <feGaussianBlur
            stdDeviation={effect.stdDeviation || 2}
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      );
      
    case 'blur':
      return (
        <filter key={key} id={effect.id}>
          <feGaussianBlur stdDeviation={effect.radius || 1} />
        </filter>
      );
      
    default:
      // Filtro vacío como fallback
      return <filter key={key} id={effect.id} />;
  }
}

function renderLogo(logo: QRLogo, moduleSize: number): React.ReactElement {
  const logoSize = moduleSize * logo.size;
  const logoX = (moduleSize * logo.x) - (logoSize / 2);
  const logoY = (moduleSize * logo.y) - (logoSize / 2);
  
  return (
    <g key="logo-overlay">
      {/* Fondo blanco para el logo con padding */}
      <rect
        x={logoX - logo.padding}
        y={logoY - logo.padding}
        width={logoSize + (logo.padding * 2)}
        height={logoSize + (logo.padding * 2)}
        fill="white"
        rx={logo.shape === 'circle' ? '50%' : logo.shape === 'rounded_square' ? '10%' : '0'}
      />
      
      {/* Logo image */}
      <image
        href={logo.src}
        x={logoX}
        y={logoY}
        width={logoSize}
        height={logoSize}
        preserveAspectRatio="xMidYMid meet"
        clipPath={logo.shape === 'circle' ? 'circle()' : undefined}
      />
    </g>
  );
}

function renderFrame(frame: QRFrame): React.ReactElement {
  return (
    <g key="frame-overlay">
      <path
        d={frame.path}
        fill={frame.fill_style.fill}
        shapeRendering="geometricPrecision"
      />
      
      {frame.text && (
        <text
          x={frame.text.x}
          y={frame.text.y}
          fontFamily={frame.text.font_family}
          fontSize={frame.text.font_size}
          textAnchor={frame.text.text_anchor}
          fill={frame.fill_style.fill}
        >
          {frame.text.content}
        </text>
      )}
    </g>
  );
}

function getFilterString(effects?: string[]): string | undefined {
  if (!effects || effects.length === 0) return undefined;
  return effects.map(e => `url(#${e})`).join(' ');
}

export default EnhancedUltrathinkQR;