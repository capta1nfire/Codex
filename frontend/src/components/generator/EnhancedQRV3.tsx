/**
 * EnhancedQRV3 Component - CODEX v3 Enhanced Implementation
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
import { QRLogoMask, UntouchableZonesDebug } from './QRLogoMask';

// Tipos para la estructura Enhanced v3
export interface QREnhancedData {
  paths: {
    data: string;
    data_modules?: Array<{
      x: number;
      y: number;
      path: string;
    }>;
    eyes: Array<{
      type: string;
      path?: string; // Legacy single path (optional for backward compatibility)
      border_path?: string; // New separated border path
      center_path?: string; // New separated center path
      shape?: string;
      border_color?: string; // Per-eye border color
      center_color?: string; // Per-eye center color
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
    background?: {
      fill?: string;
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
    exclusion_info?: {
      excluded_modules: number;
      affected_codewords: number;
      occlusion_percentage: number;
      selected_ecl: string;
      ecl_override: boolean;
    };
  };
  untouchable_zones?: Array<{
    zone_type: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
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
  per_module?: boolean;
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

interface EnhancedQRV3Props {
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
  
  // Fondo transparente toggle
  transparentBackground?: boolean;
  
  // Accesibilidad
  title?: string;
  description?: string;
  
  // Clases CSS adicionales
  className?: string;
  
  // Callback cuando el QR es clickeado
  onClick?: () => void;
  
  // Opciones de depuración
  debugUntouchableZones?: boolean;
  
  // Ratio del tamaño del logo (si existe)
  logoSizeRatio?: number;
}

export const EnhancedQRV3: React.FC<EnhancedQRV3Props> = ({
  data,
  totalModules,
  dataModules,
  size = 300,
  backgroundColor = 'transparent',
  transparentBackground = false,
  title = 'Código QR',
  description,
  className = '',
  onClick,
  debugUntouchableZones = false,
  logoSizeRatio,
}) => {
  const QUIET_ZONE = data?.metadata?.quiet_zone || 4;
  
  // Helper para acceso seguro a estilos
  const getStyle = (path: string, defaultValue: any = undefined) => {
    const paths = path.split('.');
    let current: any = data?.styles;
    for (const p of paths) {
      current = current?.[p];
      if (current === undefined) return defaultValue;
    }
    return current;
  };
  
  // 🚨 CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
  // This logic determines the QR background color based on the transparent toggle
  // - When transparentBackground is true: Always use 'transparent' (shows container background)
  // - When false: Use data background if available, otherwise backgroundColor prop, otherwise white (#FFFFFF)
  // ⚠️ This is a VISUAL-ONLY change, no backend regeneration needed ⚠️
  const bgColor = transparentBackground ? 'transparent' : (getStyle('background.fill') || backgroundColor || '#FFFFFF');
  
  // Debug log - DIAGNÓSTICO URGENTE
  const hasPerModuleGradient = data?.definitions?.some(
    def => def.type === 'gradient' && (def as QRGradientDef).per_module
  );
  
  console.log('[EnhancedQRV3] 🚨 DIAGNÓSTICO URGENTE - Gradientes recibidos:', {
    definitions: data?.definitions,
    gradientCount: data?.definitions?.filter(def => def.type === 'gradient').length,
    gradientTypes: data?.definitions?.filter(def => def.type === 'gradient').map(def => ({
      id: def.id,
      type: (def as QRGradientDef).gradient_type,
      colors: (def as QRGradientDef).colors,
      angle: (def as QRGradientDef).angle
    }))
  });
  
  // EnhancedQRV3 render initialized with data
  
  // Calcular viewBox usando la fórmula QR v3, ajustando para bordes
  const viewBox = useMemo(() => {
    if (!dataModules || dataModules <= 0) {
      console.error('Invalid dataModules:', dataModules);
      return '0 0 1 1';
    }
    
    // Obtener el ancho máximo de stroke para ajustar el viewBox
    const maxStrokeWidth = Math.max(
      getStyle('data.stroke.width', 0),
      getStyle('eyes.stroke.width', 0)
    );
    
    // Ajustar QUIET_ZONE para incluir espacio para los bordes
    const adjustedQuietZone = QUIET_ZONE - maxStrokeWidth / 2;
    const adjustedSize = dataModules + maxStrokeWidth;
    
    return `${adjustedQuietZone} ${adjustedQuietZone} ${adjustedSize} ${adjustedSize}`;
  }, [dataModules, QUIET_ZONE, data?.styles]);
  
  // Renderizar definiciones (gradientes y efectos)
  const definitions = useMemo(() => {
    const defs = [];
    
    // Add standard definitions from data
    if (data.definitions && data.definitions.length > 0) {
      data.definitions.forEach((def) => {
        if (def.type === 'gradient') {
          defs.push(renderGradient(def as QRGradientDef, dataModules));
        } else if (def.type === 'effect') {
          defs.push(renderEffect(def as QREffectDef));
        }
      });
    }
    
    // Check if we need per-module gradients
    const hasPerModuleGradient = data.definitions?.some(
      def => def.type === 'gradient' && (def as QRGradientDef).per_module
    );
    
    // If we have per-module gradients, create gradient definitions for each module
    if (hasPerModuleGradient && data?.paths?.data_modules) {
      const gradDef = data.definitions?.find(
        def => def.type === 'gradient' && def.id === 'grad_data'
      ) as QRGradientDef | undefined;
      
      if (gradDef) {
        console.log('[EnhancedQRV3] Creating per-module gradients:', {
          gradientType: gradDef.gradient_type,
          colors: gradDef.colors,
          moduleCount: data.paths.data_modules.length
        });
        
        data.paths.data_modules.forEach((module) => {
          const gradientId = `grad_module_${module.x}_${module.y}`;
          
          if (gradDef.gradient_type === 'radial') {
            defs.push(
              <radialGradient
                key={gradientId}
                id={gradientId}
                cx="50%"
                cy="50%"
                r="50%"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" stopColor={gradDef.colors[0]} />
                <stop offset="100%" stopColor={gradDef.colors[1]} />
              </radialGradient>
            );
          } else {
            // Linear gradient (default)
            const angle = gradDef.angle || 0;
            defs.push(
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0%"
                y1="0%"
                x2={angle === 45 ? "100%" : angle === 90 ? "0%" : "100%"}
                y2={angle === 45 ? "100%" : angle === 90 ? "100%" : "0%"}
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" stopColor={gradDef.colors[0]} />
                <stop offset="100%" stopColor={gradDef.colors[1]} />
              </linearGradient>
            );
          }
        });
      }
    }
    
    return defs.length > 0 ? defs : null;
  }, [data.definitions, data.paths?.data_modules, dataModules]);
  
  // IDs únicos para accesibilidad
  const titleId = useMemo(() => 
    `qr-title-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );
  const descId = useMemo(() => 
    description ? `qr-desc-${Math.random().toString(36).substr(2, 9)}` : undefined, 
    [description]
  );
  
  // ID único para la máscara del logo
  const maskId = useMemo(() => 
    `qr-logo-mask-${Math.random().toString(36).substr(2, 9)}`, 
    []
  );
  
  // Determinar si necesitamos usar máscara de exclusión
  const hasLogoWithExclusion = useMemo(() => {
    return data?.overlays?.logo && data?.metadata?.exclusion_info && logoSizeRatio;
  }, [data?.overlays?.logo, data?.metadata?.exclusion_info, logoSizeRatio]);
  
  // Verificación temprana de datos mínimos
  if (!data || !data.paths || (!data.paths.data && !data.paths.data_modules)) {
    console.error('[EnhancedQRV3] Missing required data:', {
      hasData: !!data,
      hasPaths: !!data?.paths,
      hasDataPath: !!data?.paths?.data,
      hasDataModules: !!data?.paths?.data_modules,
      paths: data?.paths
    });
    return (
      <div className={`enhanced-qr-v3-container ${className}`} style={{ width: size, height: size }}>
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>No QR data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`enhanced-qr-v3-container ${className}`}
      style={{ 
        width: size, 
        height: size,
        // 🚨 CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
        // This backgroundColor logic extends the QR background to cover the quiet zone
        // - When transparentBackground is true: Shows container background (green debug border)
        // - When false: Uses bgColor which includes user-selected colors from Color tab
        // ⚠️ Changing this breaks the quiet zone background coverage feature ⚠️
        backgroundColor: transparentBackground ? 'transparent' : bgColor,
        cursor: onClick ? 'pointer' : 'default',
        // 🚨 CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
        // This padding calculation creates the visual quiet zone with background color
        // - Formula: size * QUIET_ZONE / totalModules * 0.35
        // - The 0.35 factor provides subtle padding (35% of full quiet zone)
        // - boxSizing: 'border-box' ensures total size remains consistent
        // ⚠️ ANY change to these values will break the quiet zone appearance ⚠️
        padding: `${size * QUIET_ZONE / totalModules * 0.35}px`,
        boxSizing: 'border-box',
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
        
        {/* Definiciones (gradientes, efectos y máscaras) */}
        <defs>
          {definitions}
          
          {/* Máscara de exclusión del logo si es necesaria */}
          {hasLogoWithExclusion && data.overlays?.logo && (
            <QRLogoMask
              maskId={maskId}
              totalModules={totalModules}
              dataModules={dataModules}
              quietZone={QUIET_ZONE}
              logoSize={logoSizeRatio || data.overlays.logo.size}
              logoShape={data.overlays.logo.shape as 'square' | 'circle' | 'rounded-square'}
              untouchableZones={data.untouchable_zones}
            />
          )}
        </defs>
        
        
        {/* Grupo principal con efectos y máscara si existe */}
        <g 
          filter={getFilterString(data?.styles?.data?.effects)}
          mask={hasLogoWithExclusion ? `url(#${maskId})` : undefined}
        >
          {/* Renderizar módulos individuales si existen (para gradiente por módulo) */}
          {/* IMPORTANT: Render EITHER individual modules OR single path, never both */}
          {data?.paths?.data_modules && data.paths.data_modules.length > 0 ? (
            <g>
              {console.log('[EnhancedQRV3] About to render modules:', {
                moduleCount: data.paths.data_modules.length,
                firstFiveModules: data.paths.data_modules.slice(0, 5)
              })}
              {data.paths.data_modules.map((module, index) => {
              // Debug individual module rendering
              if (index < 5) {
                console.log(`[EnhancedQRV3] Module ${index}:`, module);
              }
              
              // For per-module gradients, we just need to reference the pre-defined gradients
              if (hasPerModuleGradient) {
                const gradientId = `grad_module_${module.x}_${module.y}`;
                // Use gradient with fallback to solid color
                const fillValue = `url(#${gradientId})`;
                
                return (
                  <path
                    key={`module-${module.x}-${module.y}-${index}`}
                    d={module.path}
                    fill={fillValue}
                    shapeRendering="crispEdges"
                    {...(getStyle('data.stroke.enabled') ? {
                      stroke: getStyle('data.stroke.color', '#FFFFFF'),
                      strokeWidth: getStyle('data.stroke.width', 0.1),
                      strokeOpacity: getStyle('data.stroke.opacity', 0.3),
                    } : {})}
                  />
                );
              }
              
              // Standard module rendering without per-module gradient
              return (
                <path
                  key={`module-${module.x}-${module.y}-${index}`}
                  d={module.path}
                  fill={getStyle('data.fill', '#000000')}
                  shapeRendering="crispEdges"
                  {...(getStyle('data.stroke.enabled') ? {
                    stroke: getStyle('data.stroke.color', '#FFFFFF'),
                    strokeWidth: getStyle('data.stroke.width', 0.1),
                    strokeOpacity: getStyle('data.stroke.opacity', 0.3),
                  } : {})}
                />
              );
            })}
            </g>
          ) : (
            /* Path de datos único (comportamiento normal) */
            /* 🚨 CRITICAL: DO NOT MODIFY WITHOUT EXPLICIT PERMISSION 🚨
                This conditional stroke rendering is controlled by the "Aplicar bordes al gradiente" toggle
                - Only applies stroke when data.styles.data.stroke.enabled is TRUE
                - The backend sends enabled:false when toggle is OFF, enabled:true when ON
                - This ensures borders only appear when user explicitly enables them
                ⚠️ DO NOT change to check only stroke existence - must check enabled flag ⚠️ */
            <path
              d={data?.paths?.data || ''}
              fill={getStyle('data.fill', '#000000')}
              shapeRendering="crispEdges"
              {...(getStyle('data.stroke.enabled') ? {
                stroke: getStyle('data.stroke.color', '#FFFFFF'),
                strokeWidth: getStyle('data.stroke.width', 0.1),
                strokeOpacity: getStyle('data.stroke.opacity', 0.3),
              } : {})}
            />
          )}
        </g>
        
        {/* Grupo de ojos con efectos y máscara si existe */}
        <g 
          filter={getFilterString(getStyle('eyes.effects'))}
          mask={hasLogoWithExclusion ? `url(#${maskId})` : undefined}
        >
          {/* Paths de ojos */}
          {(data?.paths?.eyes || []).map((eye, index) => {
            // Handle new separated border_path and center_path structure
            if (eye.border_path && eye.center_path) {
              return (
                <g key={`eye-${eye.type}-${index}`}>
                  {/* Border path */}
                  <path
                    d={eye.border_path}
                    fill={eye.border_color || getStyle('eyes.fill', '#000000')}
                    fillRule="evenodd"
                    shapeRendering="crispEdges"
                    data-eye-type={eye.type}
                    data-eye-shape={eye.shape}
                    data-eye-part="border"
                    {...(getStyle('eyes.stroke.enabled') ? {
                      stroke: getStyle('eyes.stroke.color', '#FFFFFF'),
                      strokeWidth: getStyle('eyes.stroke.width', 0.1),
                      strokeOpacity: getStyle('eyes.stroke.opacity', 0.3),
                    } : {})}
                  />
                  {/* Center path */}
                  <path
                    d={eye.center_path}
                    fill={eye.center_color || getStyle('eyes.fill', '#000000')}
                    shapeRendering="crispEdges"
                    data-eye-type={eye.type}
                    data-eye-shape={eye.shape}
                    data-eye-part="center"
                    {...(getStyle('eyes.stroke.enabled') ? {
                      stroke: getStyle('eyes.stroke.color', '#FFFFFF'),
                      strokeWidth: getStyle('eyes.stroke.width', 0.1),
                      strokeOpacity: getStyle('eyes.stroke.opacity', 0.3),
                    } : {})}
                  />
                </g>
              );
            }
            
            // Fallback to legacy single path for backward compatibility
            if (eye.path) {
              return (
                <path
                  key={`eye-${eye.type}-${index}`}
                  d={eye.path}
                  fill={eye.border_color || getStyle('eyes.fill', '#000000')}
                  fillRule="evenodd"
                  shapeRendering="crispEdges"
                  data-eye-type={eye.type}
                  data-eye-shape={eye.shape}
                  {...(getStyle('eyes.stroke.enabled') ? {
                    stroke: getStyle('eyes.stroke.color', '#FFFFFF'),
                    strokeWidth: getStyle('eyes.stroke.width', 0.1),
                    strokeOpacity: getStyle('eyes.stroke.opacity', 0.3),
                  } : {})}
                />
              );
            }
            
            // Skip if no path data is available
            console.warn(`Eye ${index} of type ${eye.type} has no path data`);
            return null;
          })}
        </g>
        
        {/* Debug de zonas intocables si está habilitado */}
        {debugUntouchableZones && data.untouchable_zones && (
          <UntouchableZonesDebug 
            zones={data.untouchable_zones}
            quietZone={QUIET_ZONE}
          />
        )}
        
        {/* Overlays (logo y frame) si existen */}
        {data.overlays?.logo && renderLogo(data.overlays.logo, totalModules, Boolean(hasLogoWithExclusion))}
        {data.overlays?.frame && renderFrame(data.overlays.frame)}
      </svg>
      
      {/* Estilos inline para garantizar comportamiento */}
      <style jsx>{`
        .enhanced-qr-v3-container {
          display: inline-block;
          line-height: 0;
          position: relative;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
        }
        
        .enhanced-qr-v3-container svg {
          display: block;
          /* Debug: asegurar que no hay espacio extra */
          vertical-align: top;
          margin: 0;
          padding: 0;
        }
        
        /* Estilos de impresión */
        @media print {
          .enhanced-qr-v3-container svg path {
            shape-rendering: crispEdges !important;
          }
          
          .enhanced-qr-v3-container {
            background-color: white !important;
          }
          
          /* Desactivar efectos en impresión para mejor claridad */
          .enhanced-qr-v3-container svg g {
            filter: none !important;
          }
        }
        
        /* Animación sutil para interactividad */
        .enhanced-qr-v3-container[role="button"]:hover {
          opacity: 0.95;
          transition: opacity 0.2s ease;
        }
        
        .enhanced-qr-v3-container[role="button"]:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

// Funciones auxiliares para renderizar elementos

function renderGradient(gradient: QRGradientDef, viewBoxSize: number): React.ReactElement {
  const key = `gradient-${gradient.id}`;
  
  console.log('[EnhancedQRV3] 🚨 RENDERIZANDO GRADIENTE:', {
    id: gradient.id,
    type: gradient.gradient_type,
    colors: gradient.colors,
    angle: gradient.angle,
    key: key
  });
  
  switch (gradient.gradient_type.toLowerCase()) {
    case 'linear':
      // Convert angle to SVG linear gradient coordinates
      // SVG angles are measured clockwise from the positive X axis
      const angle = gradient.angle || 90;
      const radians = (angle * Math.PI) / 180;
      
      // Calculate end coordinates based on angle
      // For SVG gradients, we need to project the angle onto a unit circle
      const x2 = 50 + 50 * Math.cos(radians);
      const y2 = 50 + 50 * Math.sin(radians);
      
      console.log(`[EnhancedQRV3] Linear gradient angle calculation:`, {
        gradientId: gradient.id,
        originalAngle: angle,
        radians: radians,
        x1: "50%",
        y1: "50%", 
        x2: `${x2}%`,
        y2: `${y2}%`,
        colors: gradient.colors,
        stopDistribution: gradient.colors.length === 2 ? '0%-100% (full distribution)' : 'uniform'
      });
      
      return (
        <linearGradient
          key={key}
          id={gradient.id}
          x1="50%"
          y1="50%"
          x2={`${x2}%`}
          y2={`${y2}%`}
          {...(gradient.per_module ? { gradientUnits: "objectBoundingBox" } : {})}
        >
          {gradient.colors.map((color, i) => {
            // Ajustar distribución SOLO para lineales - balance 60/40 visual
            let offset;
            if (gradient.colors.length === 2) {
              // Para gradientes lineales: usar 0%-100% para distribución completa
              offset = i === 0 ? 0 : 100;
            } else {
              // Para más colores: distribución uniforme
              offset = (i / (gradient.colors.length - 1)) * 100;
            }
            
            console.log(`[EnhancedQRV3] Linear gradient stop ${i}:`, {
              gradientType: gradient.gradient_type,
              gradientId: gradient.id,
              colorIndex: i,
              color: color,
              offset: `${offset}%`,
              totalColors: gradient.colors.length
            });
            
            return (
              <stop
                key={i}
                offset={`${offset}%`}
                stopColor={color}
              />
            );
          })}
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
          {...(gradient.per_module ? { gradientUnits: "objectBoundingBox" } : {})}
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
          {...(gradient.per_module ? { gradientUnits: "objectBoundingBox" } : {})}
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
      
    case 'diamond':
      // Diamond gradient using radial with transform - better centered
      return (
        <radialGradient
          key={key}
          id={gradient.id}
          cx="50%"
          cy="50%"
          r="50%"
          gradientUnits="objectBoundingBox"
          gradientTransform="scale(1.8, 0.6) rotate(45, 0.5, 0.5)"
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
      
    case 'spiral':
      // Spiral gradient using radial with multiple stops for effect
      return (
        <radialGradient
          key={key}
          id={gradient.id}
          cx="50%"
          cy="50%"
          r="50%"
          {...(gradient.per_module ? { gradientUnits: "objectBoundingBox" } : {})}
        >
          {gradient.colors.map((color, i) => {
            // Create spiral effect by alternating colors more frequently
            const stops = [];
            for (let j = 0; j <= 100; j += 20) {
              stops.push(
                <stop
                  key={`${i}-${j}`}
                  offset={`${j}%`}
                  stopColor={gradient.colors[j % gradient.colors.length]}
                />
              );
            }
            return stops;
          }).flat()}
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

function renderLogo(logo: QRLogo, totalModules: number, hasExclusion: boolean = false): React.ReactElement {
  console.log('[renderLogo] Input:', { logo, totalModules, hasExclusion });
  
  // Logo size is a percentage of the total QR size
  const logoSize = totalModules * logo.size;
  
  // Logo position - center it properly in the QR code
  // The backend sends coordinates but we'll calculate the true center
  const logoX = totalModules / 2;
  const logoY = totalModules / 2;
  
  // Padding needs to be scaled relative to the QR size
  // Convert padding from pixels to viewBox units
  // Increase padding to create more white space around logo for better QR readability
  const paddingInUnits = (logo.padding * 1.5) * totalModules / 300; // Increased padding for better contrast
  
  console.log('[renderLogo] Calculated:', {
    logoSize,
    logoX,
    logoY,
    paddingInUnits,
    shape: logo.shape,
    rectX: logoX - logoSize/2 - paddingInUnits,
    rectY: logoY - logoSize/2 - paddingInUnits,
    rectSize: logoSize + paddingInUnits * 2
  });
  
  return (
    <g key="logo-overlay">
      {/* Solo renderizar fondo blanco si NO hay exclusión nativa */}
      {!hasExclusion && (
        <rect
          x={logoX - logoSize/2}
          y={logoY - logoSize/2}
          width={logoSize}
          height={logoSize}
          fill="white"
          rx={logo.shape === 'circle' ? '50%' : (logo.shape === 'rounded_square' || logo.shape === 'roundedsquare') ? '10%' : '0'}
        />
      )}
      
      {/* Logo image */}
      <image
        href={logo.src}
        x={logoX - logoSize/2}
        y={logoY - logoSize/2}
        width={logoSize}
        height={logoSize}
        preserveAspectRatio="xMidYMid meet"
        clipPath={logo.shape === 'circle' ? 'circle()' : undefined}
      />
    </g>
  );
}

function renderFrame(frame: QRFrame): React.ReactElement {
  console.log('[renderFrame] Debug:', {
    frame,
    hasPath: !!frame.path,
    hasText: !!frame.text,
    textContent: frame.text?.content,
    textPosition: frame.text ? { x: frame.text.x, y: frame.text.y } : null
  });
  
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

export default EnhancedQRV3;