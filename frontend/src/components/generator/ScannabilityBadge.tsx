/**
 * ScannabilityBadge - Badge temporal que muestra el score durante la animación Hero
 * 
 * 🏗️ Arquitectura FLODEX: Componente presentacional puro
 * 
 * Siguiendo los 5 pilares del IA_MANIFESTO:
 * 1. 🛡️ Seguro por defecto - Props inmutables, sin efectos secundarios
 * 2. ⚙️ Robusto - Validación de score, manejo de edge cases
 * 3. ✨ Simple - Una sola responsabilidad: mostrar score
 * 4. 🏗️ Modular - Componente puro, sin dependencias externas
 * 5. ❤️ Valor para usuario - Feedback visual inmediato y claro
 */

import React from 'react';

interface ScannabilityBadgeProps {
  score: number;
  isVisible: boolean;
}

export const ScannabilityBadge: React.FC<ScannabilityBadgeProps> = ({ 
  score, 
  isVisible 
}) => {
  // 🛡️ Pilar 1: Validación estricta
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // ✨ Pilar 3: Lógica simple y directa
  const getBadgeColor = (): string => {
    if (safeScore >= 90) return 'bg-green-500 text-white';
    if (safeScore >= 70) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  // Siempre renderizar para permitir transiciones
  // El componente padre controla cuando montarlo/desmontarlo
  
  return (
    <div 
      className={`
        absolute -top-1 -left-12
        ${getBadgeColor()}
        px-2 py-0.5 rounded-full
        text-xs font-bold
        shadow-md
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-75 translate-x-2'}
        z-40
      `}
      aria-label={`Puntuación de escaneabilidad: ${safeScore} de 100`}
    >
      {safeScore}/100
    </div>
  );
};

// 🏗️ Pilar 4: Exportación modular
export default ScannabilityBadge;