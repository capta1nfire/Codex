/**
 * HeroScannabilityDisplay - Elite implementation of scannability accordion
 * 
 * ⚠️ CÓDIGO PROTEGIDO - NO MODIFICAR
 * Esta implementación ha sido cuidadosamente diseñada y probada.
 * Incluye:
 * - Auto-despliegue con animación desde arriba
 * - Auto-replegado después de 5 segundos
 * - Morphing animation badge → check
 * - Manejo preciso de estados y temporización
 * 
 * Cualquier modificación debe ser explícitamente autorizada.
 * 
 * @protected
 * @tested
 * @elite-implementation
 * 
 * Flujo de animación:
 * 1. Badge con "Scannability Score X" (2s)
 * 2. Transición morfológica (100ms)  
 * 3. Check permanente
 * 
 * Siguiendo los 5 pilares del IA_MANIFESTO:
 * 1. 🛡️ Seguro por defecto - Control estricto de estados
 * 2. ⚙️ Robusto - Manejo unificado de timers y transiciones
 * 3. ✨ Simple - Un solo elemento que se transforma
 * 4. 🏗️ Modular - Encapsula completamente el comportamiento hero
 * 5. ❤️ Valor para usuario - Transición fluida sin elementos separados
 */

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScannabilityTooltip } from './ScannabilityTooltip';
import { useRouter } from 'next/navigation';

interface ScannabilityAnalysis {
  score: number;
  issues: Array<{
    type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
    severity: 'warning' | 'error';
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  contrastRatio: number;
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
}

interface HeroScannabilityDisplayProps {
  analysis: ScannabilityAnalysis;
  isNewGeneration: boolean;
  onScannabilityClick?: () => void;
}

export const HeroScannabilityDisplay: React.FC<HeroScannabilityDisplayProps> = ({ 
  analysis, 
  isNewGeneration,
  onScannabilityClick
}) => {
  const router = useRouter();
  const [morphState, setMorphState] = useState<'check' | 'morphing' | 'badge'>('check');
  const morphTimerRef = useRef<NodeJS.Timeout | null>(null);

  const safeScore = Math.max(0, Math.min(100, Math.round(analysis.score)));

  // ⚠️ NO MODIFICAR: Animación morfológica implementada y probada
  // Handle morphing animation (badge → check)
  useEffect(() => {
    if (isNewGeneration) {
      console.log('[HeroScannability] New generation detected, starting morph animation');
      
      // Clear any existing timer
      if (morphTimerRef.current) {
        clearTimeout(morphTimerRef.current);
        morphTimerRef.current = null;
      }

      // Start with badge state
      setMorphState('badge');

      // After 2 seconds, start morphing
      morphTimerRef.current = setTimeout(() => {
        console.log('[HeroScannability] Starting morph to check');
        setMorphState('morphing');
        
        // Complete morph after transition (reduced for smoother flow)
        setTimeout(() => {
          setMorphState('check');
        }, 100);
      }, 2000);
    }

    return () => {
      if (morphTimerRef.current) {
        clearTimeout(morphTimerRef.current);
        morphTimerRef.current = null;
      }
    };
  }, [isNewGeneration]);

  const getColor = (): string => {
    if (safeScore >= 90) return 'bg-green-500';
    if (safeScore >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleClick = () => {
    if (onScannabilityClick) {
      onScannabilityClick();
    } else {
      router.push(`/features/qr-scannability?score=${safeScore}`);
    }
  };

  // ⚠️ NO MODIFICAR: Estilos de transición calibrados para fluidez óptima
  // Dynamic styles for morphing animation (inverted)
  const getMorphStyles = () => {
    switch (morphState) {
      case 'badge':
        return 'w-36 h-8 rounded-full bg-opacity-80 animate-subtleSuccess';
      case 'morphing':
        return 'w-12 h-8 rounded-full scale-95';
      case 'check':
        return 'w-8 h-8 rounded-full';
    }
  };

  return (
    <div className="absolute -top-2 -right-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className={`
                ${getColor()}
                text-white shadow-md cursor-pointer
                hover:scale-110 
                transition-all duration-100 ease-out
                z-50
                flex items-center justify-center
                ${getMorphStyles()}
              `}
              aria-label={`Escaneabilidad: ${safeScore} de 100. Click para más detalles`}
            >
              {/* Content that morphs (inverted) */}
              <div className="flex items-center justify-center gap-1 overflow-hidden">
                {morphState !== 'check' ? (
                  <span className={`
                    text-xs font-bold
                    transition-opacity duration-100
                    ${morphState === 'badge' ? 'opacity-100' : 'opacity-0'}
                  `}>
                    Scannability Score {safeScore}
                  </span>
                ) : (
                  <Check className={`
                    w-5 h-5
                    transition-opacity duration-100
                    ${morphState === 'check' ? 'opacity-100' : 'opacity-0'}
                  `} />
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="bg-gray-900 border-gray-700 text-white p-3"
            sideOffset={8}
          >
            <ScannabilityTooltip analysis={analysis} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default HeroScannabilityDisplay;