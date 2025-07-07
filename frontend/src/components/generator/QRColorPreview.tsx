import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tipos de resaltado disponibles para el preview del QR
 * Define qué componente del QR está siendo editado actualmente
 */
export type QRHighlightMode = 'none' | 'eyes' | 'pattern' | 'background' | 'gradient';

/**
 * Propiedades del componente QRColorPreview
 * Siguiendo el principio de Single Responsibility, cada prop tiene un propósito específico
 */
interface QRColorPreviewProps {
  /** Modo de resaltado actual - controla qué parte del QR se destaca */
  highlightMode: QRHighlightMode;
  /** Color principal del QR (patrón de datos) */
  foregroundColor: string;
  /** Color de fondo del QR */
  backgroundColor: string;
  /** Colores personalizados para los ojos (opcional) */
  eyeColors?: {
    outer?: string;
    inner?: string;
  };
  /** Configuración de gradiente (opcional) */
  gradientConfig?: {
    enabled: boolean;
    type: 'linear' | 'radial';
    color1: string;
    color2: string;
    direction?: string;
  };
  /** Fondo transparente habilitado */
  transparentBackground?: boolean;
  /** Clase CSS adicional para personalización */
  className?: string;
}

/**
 * Componente QRColorPreview
 * 
 * Propósito: Mostrar un mockup interactivo del QR code que resalta visualmente
 * el componente que se está editando actualmente en los controles.
 * 
 * Principios del IA_MANIFESTO aplicados:
 * - Secure by Default: Validación de colores y sanitización
 * - Robust: Manejo de errores y valores por defecto
 * - Simplicity: Nombres descriptivos y lógica clara
 * - Built for the Future: Modular y extensible
 * - User Value: Feedback visual claro e intuitivo
 */
export const QRColorPreview: React.FC<QRColorPreviewProps> = React.memo(({
  highlightMode = 'none',
  foregroundColor = '#000000',
  backgroundColor = '#FFFFFF',
  eyeColors,
  gradientConfig,
  transparentBackground = false,
  className
}) => {
  
  /**
   * Validación y sanitización de colores
   * Principio: Secure by Default - nunca confiar en datos externos
   */
  const sanitizedColors = useMemo(() => {
    const isValidColor = (color: string): boolean => {
      return /^#[0-9A-Fa-f]{6}$/.test(color);
    };

    return {
      foreground: isValidColor(foregroundColor) ? foregroundColor : '#000000',
      background: isValidColor(backgroundColor) ? backgroundColor : '#FFFFFF',
      eyeOuter: eyeColors?.outer && isValidColor(eyeColors.outer) ? eyeColors.outer : null,
      eyeInner: eyeColors?.inner && isValidColor(eyeColors.inner) ? eyeColors.inner : null,
    };
  }, [foregroundColor, backgroundColor, eyeColors]);

  /**
   * Cálculo del color del patrón (con gradiente o sólido)
   * Principio: Robust - manejar casos edge gracefully
   */
  const patternColor = useMemo(() => {
    if (gradientConfig?.enabled) {
      const { type, color1, color2, direction } = gradientConfig;
      
      // Validar colores del gradiente
      const validColor1 = /^#[0-9A-Fa-f]{6}$/.test(color1) ? color1 : '#000000';
      const validColor2 = /^#[0-9A-Fa-f]{6}$/.test(color2) ? color2 : '#000000';
      
      if (type === 'linear') {
        const gradientDirection = direction === 'left-right' ? 'to right' : 
                                direction === 'diagonal' ? 'to bottom right' : 'to bottom';
        return `linear-gradient(${gradientDirection}, ${validColor1}, ${validColor2})`;
      } else {
        return `radial-gradient(circle, ${validColor1}, ${validColor2})`;
      }
    }
    return sanitizedColors.foreground;
  }, [gradientConfig, sanitizedColors.foreground]);

  /**
   * Estilos dinámicos basados en el modo de resaltado
   * Principio: User Value - feedback visual claro
   */
  const getElementStyles = useMemo(() => {
    const baseOpacity = 0.3; // Opacidad para elementos atenuados
    const activeOpacity = 1.0; // Opacidad para elementos activos
    
    return {
      eyes: {
        opacity: highlightMode === 'eyes' ? activeOpacity : 
                highlightMode === 'none' ? activeOpacity : baseOpacity,
        transition: 'opacity 0.2s ease-in-out',
        filter: highlightMode === 'eyes' ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none'
      },
      pattern: {
        opacity: highlightMode === 'pattern' || highlightMode === 'gradient' ? activeOpacity : 
                highlightMode === 'none' ? activeOpacity : baseOpacity,
        transition: 'opacity 0.2s ease-in-out',
        filter: (highlightMode === 'pattern' || highlightMode === 'gradient') ? 
                'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none'
      },
      background: {
        opacity: highlightMode === 'background' ? activeOpacity : 
                highlightMode === 'none' ? activeOpacity : baseOpacity,
        transition: 'opacity 0.2s ease-in-out',
        filter: highlightMode === 'background' ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none'
      }
    };
  }, [highlightMode]);

  return (
    <div className={cn(
      "relative w-full max-w-[200px] mx-auto aspect-square",
      "border-2 border-slate-200 dark:border-slate-700 rounded-lg",
      "bg-slate-50 dark:bg-slate-900/50 p-4",
      className
    )}>
      {/* Título del Preview */}
      <div className="absolute -top-6 left-0 right-0 text-center">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Preview
        </span>
      </div>

      {/* Contenedor del QR Mockup */}
      <div 
        className="relative w-full h-full rounded-md overflow-hidden"
        style={{
          backgroundColor: transparentBackground ? 'transparent' : sanitizedColors.background,
          backgroundImage: transparentBackground ? 
            'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)' : 
            'none',
          backgroundSize: transparentBackground ? '8px 8px' : 'auto',
          backgroundPosition: transparentBackground ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
          ...getElementStyles.background
        }}
      >
        {/* Ojos del QR (3 esquinas) */}
        {/* Ojo Superior Izquierdo */}
        <div 
          className="absolute top-1 left-1 w-8 h-8 rounded-sm"
          style={{
            backgroundColor: sanitizedColors.eyeOuter || patternColor,
            ...getElementStyles.eyes
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2 w-4 h-4 rounded-sm transform -translate-x-1/2 -translate-y-1/2"
            style={{
              backgroundColor: sanitizedColors.eyeInner || sanitizedColors.background,
            }}
          />
        </div>

        {/* Ojo Superior Derecho */}
        <div 
          className="absolute top-1 right-1 w-8 h-8 rounded-sm"
          style={{
            backgroundColor: sanitizedColors.eyeOuter || patternColor,
            ...getElementStyles.eyes
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2 w-4 h-4 rounded-sm transform -translate-x-1/2 -translate-y-1/2"
            style={{
              backgroundColor: sanitizedColors.eyeInner || sanitizedColors.background,
            }}
          />
        </div>

        {/* Ojo Inferior Izquierdo */}
        <div 
          className="absolute bottom-1 left-1 w-8 h-8 rounded-sm"
          style={{
            backgroundColor: sanitizedColors.eyeOuter || patternColor,
            ...getElementStyles.eyes
          }}
        >
          <div 
            className="absolute top-1/2 left-1/2 w-4 h-4 rounded-sm transform -translate-x-1/2 -translate-y-1/2"
            style={{
              backgroundColor: sanitizedColors.eyeInner || sanitizedColors.background,
            }}
          />
        </div>

        {/* Patrón de Datos del QR (área central) */}
        <div 
          className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5 p-12"
          style={getElementStyles.pattern}
        >
          {/* Generamos un patrón de puntos simulando el QR */}
          {Array.from({ length: 64 }, (_, i) => {
            // Patrón pseudo-aleatorio pero consistente
            const shouldShow = (i + Math.floor(i / 8)) % 3 !== 0;
            return shouldShow ? (
              <div
                key={i}
                className="w-full h-full rounded-sm"
                style={{
                  background: patternColor,
                }}
              />
            ) : null;
          })}
        </div>
      </div>

      {/* Indicador del modo activo */}
      {highlightMode !== 'none' && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">
            Editando: {highlightMode === 'eyes' ? 'Ojos' : 
                      highlightMode === 'pattern' ? 'Patrón' : 
                      highlightMode === 'gradient' ? 'Gradiente' : 
                      highlightMode === 'background' ? 'Fondo' : ''}
          </span>
        </div>
      )}
    </div>
  );
});

// Nombre del componente para debugging
QRColorPreview.displayName = 'QRColorPreview';

export default QRColorPreview; 