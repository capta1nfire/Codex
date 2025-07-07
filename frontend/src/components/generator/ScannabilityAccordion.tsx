/**
 * ScannabilityAccordion - Componente de acordeón para mostrar análisis de escaneabilidad
 * 
 * Siguiendo los 5 pilares del IA_MANIFESTO:
 * 1. 🛡️ Seguro por defecto - Validación estricta de props, sanitización de datos
 * 2. ⚙️ Robusto - Manejo de errores, estados edge case, timeouts configurables
 * 3. ✨ Simple - Interfaz minimalista, código legible, lógica directa
 * 4. 🏗️ Modular - Componente independiente, reutilizable, bajo acoplamiento
 * 5. ❤️ Valor para usuario - UX intuitiva, accesible, información clara
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🛡️ Pilar 1: Validación estricta de tipos
interface ScannabilityAnalysis {
  score: number;
  issues: Array<{
    type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
    severity: 'warning' | 'error';
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  contrastRatio: number;
}

interface ScannabilityAccordionProps {
  analysis: ScannabilityAnalysis | null;
  isLoading?: boolean;
  className?: string;
  autoCollapseDelay?: number; // ⚙️ Pilar 2: Configurable para robustez
}

export const ScannabilityAccordion: React.FC<ScannabilityAccordionProps> = ({ 
  analysis, 
  isLoading = false,
  className = '',
  autoCollapseDelay = 3000 // Default 3 segundos
}) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  // 🛡️ Pilar 1: Validación de score
  const validScore = analysis?.score ?? 0;
  const safeScore = Math.max(0, Math.min(100, validScore));

  // ⚙️ Pilar 2: Efecto robusto con cleanup
  useEffect(() => {
    // Solo ejecutar si el score cambió (nuevo análisis)
    if (analysis && safeScore > 0 && lastScore !== safeScore) {
      console.log('[ScannabilityAccordion] New score detected:', safeScore, 'Auto-expanding, will collapse in', autoCollapseDelay, 'ms');
      
      // Limpiar timer anterior si existe
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
      
      // Auto-expandir
      setIsExpanded(true);
      setLastScore(safeScore);

      // Auto-colapsar después del delay
      autoCollapseTimerRef.current = setTimeout(() => {
        console.log('[ScannabilityAccordion] Auto-collapsing now');
        setIsExpanded(false);
      }, autoCollapseDelay);
    }
  }, [safeScore, lastScore, autoCollapseDelay]);

  // Cleanup cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
        autoCollapseTimerRef.current = null;
      }
    };
  }, []);

  // ✨ Pilar 3: Funciones simples y directas
  const handleToggle = useCallback(() => {
    // Cancelar auto-colapso si el usuario interactúa
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleReadMore = useCallback(() => {
    router.push(`/features/qr-scannability?score=${safeScore}`);
  }, [router, safeScore]);

  // No renderizar si no hay análisis
  if (!analysis || isLoading) {
    return null;
  }

  // ✨ Pilar 3: Helpers simples para UI
  const getScoreColor = () => {
    if (safeScore >= 90) return 'text-green-600 dark:text-green-400';
    if (safeScore >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreIcon = () => {
    if (safeScore >= 90) return <CheckCircle className="w-5 h-5" />;
    if (safeScore >= 70) return <AlertCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const getBgColor = () => {
    if (safeScore >= 90) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (safeScore >= 70) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div 
      ref={accordionRef}
      className={`
        absolute top-0 left-0 right-0 z-20
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {/* Pestaña siempre visible - Minimalista */}
      <button
        onClick={handleToggle}
        className={`
          w-full px-3 py-2
          ${getBgColor()}
          border-b-2
          transition-all duration-200
          hover:opacity-90
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          ${isExpanded ? 'rounded-t-lg' : 'rounded-lg shadow-sm'}
        `}
        aria-expanded={isExpanded}
        aria-label={`Escaneabilidad: ${safeScore} de 100. ${isExpanded ? 'Contraer' : 'Expandir'} detalles`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getScoreColor()}>{getScoreIcon()}</span>
            <span className={`text-sm font-medium ${getScoreColor()}`}>
              Escaneabilidad: {safeScore}/100
            </span>
          </div>
          <ChevronDown 
            className={`
              w-4 h-4 transition-transform duration-200
              ${isExpanded ? 'rotate-180' : ''}
              ${getScoreColor()}
            `}
          />
        </div>
      </button>

      {/* Contenido expandible */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-96' : 'max-h-0'}
        `}
      >
        <div className={`
          p-4 space-y-3
          ${getBgColor()}
          border-b-2 border-x-2
          rounded-b-lg
        `}>
          {/* Ratio de contraste */}
          {analysis.contrastRatio && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Contraste: {analysis.contrastRatio.toFixed(1)}:1
              {analysis.contrastRatio < 4.5 && (
                <span className="text-red-600 dark:text-red-400 ml-1">
                  (mínimo recomendado: 4.5:1)
                </span>
              )}
            </div>
          )}

          {/* Nivel de corrección sugerido */}
          {analysis.suggestedECC && (
            <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-2 rounded">
              <strong>Corrección sugerida:</strong> {analysis.suggestedECC}
              {analysis.suggestedECC === 'H' && ' (Alta - 30% recuperación)'}
              {analysis.suggestedECC === 'Q' && ' (Media-Alta - 25% recuperación)'}
              {analysis.suggestedECC === 'M' && ' (Media - 15% recuperación)'}
              {analysis.suggestedECC === 'L' && ' (Baja - 7% recuperación)'}
            </div>
          )}

          {/* Problemas principales */}
          {analysis.issues.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Problemas detectados:
              </h4>
              {analysis.issues.slice(0, 2).map((issue, index) => (
                <div 
                  key={index}
                  className={`text-xs p-1.5 rounded ${
                    issue.severity === 'error' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  }`}
                >
                  {issue.message}
                </div>
              ))}
              {analysis.issues.length > 2 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +{analysis.issues.length - 2} más...
                </p>
              )}
            </div>
          )}

          {/* Botón para más detalles */}
          <button
            onClick={handleReadMore}
            className="
              w-full mt-2 py-2 px-3
              text-xs font-medium
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors duration-200
              flex items-center justify-center gap-1
            "
          >
            Ver análisis completo
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 🏗️ Pilar 4: Exportación modular
export default ScannabilityAccordion;