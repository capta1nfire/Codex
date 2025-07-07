/**
 * ScannabilityTooltip - Tooltip content for scannability analysis
 * 
 * Siguiendo los 5 pilares del IA_MANIFESTO:
 * 1. 🛡️ Seguro por defecto - Validación estricta de props
 * 2. ⚙️ Robusto - Manejo de casos edge
 * 3. ✨ Simple - Información clara y concisa
 * 4. 🏗️ Modular - Componente independiente
 * 5. ❤️ Valor para usuario - Información útil sin ser invasiva
 */

import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

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

interface ScannabilityTooltipProps {
  analysis: ScannabilityAnalysis;
}

export const ScannabilityTooltip: React.FC<ScannabilityTooltipProps> = ({ analysis }) => {
  const validScore = Math.max(0, Math.min(100, analysis.score));
  
  const getScoreLabel = () => {
    if (validScore >= 90) return 'Excelente';
    if (validScore >= 70) return 'Buena';
    return 'Mejorable';
  };

  const getScoreColor = () => {
    if (validScore >= 90) return 'text-green-400';
    if (validScore >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Mostrar solo los problemas más críticos
  const criticalIssues = analysis.issues
    .filter(issue => issue.severity === 'error')
    .slice(0, 2);
  
  const warningCount = analysis.issues.filter(issue => issue.severity === 'warning').length;

  return (
    <div className="w-48 p-2">
      {/* Compact Score Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor()}`}>
            {validScore}
          </span>
          <div>
            <div className="text-xs font-medium text-white">Escaneabilidad</div>
            <div className={`text-xs ${getScoreColor()}`}>{getScoreLabel()}</div>
          </div>
        </div>
      </div>

      {/* Compact Issues Summary */}
      {(criticalIssues.length > 0 || warningCount > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          {criticalIssues.length > 0 && (
            <div className="flex items-start gap-1 text-xs">
              <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{criticalIssues[0].message}</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <AlertCircle className="w-3 h-3 text-yellow-400" />
              <span className="text-gray-300">{warningCount} advertencia{warningCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Minimal CTA */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        Click para detalles →
      </div>
    </div>
  );
};

export default ScannabilityTooltip;