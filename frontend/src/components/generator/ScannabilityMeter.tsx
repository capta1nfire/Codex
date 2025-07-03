import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ScannabilityAnalysis {
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  contrastRatio: number;
}

interface ValidationIssue {
  type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
  severity: 'warning' | 'error';
  message: string;
  suggestion?: string;
}

interface ScannabilityMeterProps {
  analysis: ScannabilityAnalysis | null;
  isLoading?: boolean;
  className?: string;
}

export const ScannabilityMeter: React.FC<ScannabilityMeterProps> = ({ 
  analysis, 
  isLoading = false,
  className = '' 
}) => {
  if (isLoading) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const { score, issues, recommendations, suggestedECC, contrastRatio } = analysis;

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = () => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIcon = () => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (score >= 70) return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Escaneabilidad
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor()}`}>
            {score}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Contrast Ratio */}
      {contrastRatio && (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Contraste: {contrastRatio.toFixed(1)}:1
          {contrastRatio < 4.5 && (
            <span className="text-red-600 dark:text-red-400 ml-1">
              (mínimo recomendado: 4.5:1)
            </span>
          )}
        </div>
      )}

      {/* Suggested ECC */}
      {suggestedECC && (
        <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-2 rounded">
          <strong>Corrección de errores sugerida:</strong> {suggestedECC}
          {suggestedECC === 'H' && ' (Alta - 30% recuperación)'}
          {suggestedECC === 'Q' && ' (Media-Alta - 25% recuperación)'}
          {suggestedECC === 'M' && ' (Media - 15% recuperación)'}
          {suggestedECC === 'L' && ' (Baja - 7% recuperación)'}
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Problemas detectados
          </h4>
          {issues.map((issue, index) => (
            <div 
              key={index}
              className={`text-xs p-2 rounded border ${
                issue.severity === 'error' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
              }`}
            >
              <div className="font-medium">{issue.message}</div>
              {issue.suggestion && (
                <div className="mt-1 opacity-90">{issue.suggestion}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && score < 90 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Recomendaciones
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Perfect Score Message */}
      {score === 100 && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
          ¡Diseño óptimo para escaneo!
        </div>
      )}
    </div>
  );
};

export default ScannabilityMeter;