'use client';

import React from 'react';

interface QRSelectiveRendererProps {
  qrData: any;
  className?: string;
}

export default function QRSelectiveRenderer({ qrData, className = '' }: QRSelectiveRendererProps) {
  if (!qrData) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 ${className}`}>
        <p className="text-gray-500 text-sm">No QR data available</p>
      </div>
    );
  }

  // Renderizar QR usando los paths estructurados
  const renderStructuredQR = () => {
    const { paths, styles, definitions } = qrData;
    const size = 300; // Tamaño fijo para la vista previa
    
    // Crear filtros SVG de las definiciones
    const filters = definitions?.filter(def => def.type === 'effect').map(def => {
      const { id, effect_type, component } = def;
      return `<filter id="${id}">
        ${getFilterDefinition(effect_type)}
      </filter>`;
    }).join('');

    // Determinar el viewBox basado en los módulos
    const modules = qrData.metadata?.total_modules || 21;
    const viewBox = `0 0 ${modules + 8} ${modules + 8}`; // +8 para quiet zone

    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className="border rounded"
        >
          {/* Definiciones de filtros */}
          {filters && (
            <defs dangerouslySetInnerHTML={{ __html: filters }} />
          )}
          
          {/* Fondo blanco */}
          <rect 
            width="100%" 
            height="100%" 
            fill="white"
          />
          
          {/* Módulos de datos */}
          <g 
            fill={styles?.data?.fill || "#000000"}
            style={{
              filter: getComponentFilter(definitions, 'data')
            }}
          >
            <path d={paths.data} />
          </g>
          
          {/* Ojos del QR */}
          {paths.eyes?.map((eye, index) => (
            <g 
              key={index}
              fill={styles?.eyes?.fill || "#000000"}
              style={{
                filter: getComponentFilter(definitions, 'eyes')
              }}
            >
              <path d={eye.path} />
            </g>
          ))}
          
          {/* Efectos globales */}
          <g style={{
            filter: getComponentFilter(definitions, 'global')
          }}>
            {/* Los efectos globales se aplican a toda la imagen */}
          </g>
        </svg>
        
        {/* Overlay de información */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {definitions?.filter(d => d.type === 'effect').length || 0} efectos
        </div>
      </div>
    );
  };

  return renderStructuredQR();
}

// Función auxiliar para obtener definiciones de filtros SVG
function getFilterDefinition(effectType: string): string {
  switch (effectType) {
    case 'glow':
      return `
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      `;
    case 'shadow':
    case 'drop_shadow':
      return `<feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.3"/>`;
    case 'blur':
      return `<feGaussianBlur stdDeviation="2"/>`;
    case 'emboss':
      return `<feConvolveMatrix order="3" kernelMatrix="-2 -1 0 -1 1 1 0 1 2" divisor="1"/>`;
    case 'outline':
      return `
        <feMorphology operator="dilate" radius="1" in="SourceGraphic" result="outline"/>
        <feFlood flood-color="black" flood-opacity="1" result="color"/>
        <feComposite in="color" in2="outline" operator="in" result="coloredOutline"/>
        <feComposite in="SourceGraphic" in2="coloredOutline" operator="over"/>
      `;
    case 'distort':
      return `
        <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="10"/>
      `;
    case 'noise':
      return `
        <feTurbulence baseFrequency="0.2" numOctaves="3" result="noise"/>
        <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
      `;
    case 'vintage':
      return `
        <feColorMatrix type="matrix" 
          values="0.8 0.343 0.169 0 0
                  0.272 0.8 0.534 0 0
                  0.105 0.216 0.8 0 0
                  0 0 0 1 0"/>
        <feGaussianBlur stdDeviation="0.4"/>
      `;
    case 'inner_shadow':
      return `
        <feOffset dx="2" dy="2" in="SourceAlpha" result="offset"/>
        <feGaussianBlur stdDeviation="3" in="offset" result="blur"/>
        <feFlood flood-color="black" flood-opacity="0.3"/>
        <feComposite in2="blur" operator="in"/>
        <feComposite in2="SourceGraphic" operator="over"/>
      `;
    default:
      return '';
  }
}

// Función auxiliar para obtener filtros por componente
function getComponentFilter(definitions: any[], component: string): string {
  if (!definitions) return '';
  
  const componentFilters = definitions
    .filter(def => def.type === 'effect' && def.component === component)
    .map(def => `url(#${def.id})`)
    .join(' ');
    
  return componentFilters;
}