'use client';

import React, { useState } from 'react';
import { ScannabilityMeter } from '@/components/generator/ScannabilityMeter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Datos de ejemplo para diferentes escenarios
const sampleAnalysis = {
  perfect: {
    score: 100,
    issues: [],
    recommendations: [],
    contrastRatio: 21,
  },
  good: {
    score: 85,
    issues: [
      {
        type: 'logo_size' as const,
        severity: 'warning' as const,
        message: 'Logo size 22% is moderately large',
        suggestion: 'Consider reducing to 20% or less for optimal scanning',
      },
    ],
    recommendations: [],
    suggestedECC: 'Q' as const,
    contrastRatio: 7.5,
  },
  warning: {
    score: 70,
    issues: [
      {
        type: 'contrast' as const,
        severity: 'warning' as const,
        message: 'Contrast ratio 4.2:1 is below recommended',
        suggestion: 'Increase contrast to 4.5:1 or higher for best results',
      },
      {
        type: 'pattern_complexity' as const,
        severity: 'warning' as const,
        message: "Pattern 'wave' may reduce scan reliability",
        suggestion: 'Consider simpler patterns like dots or rounded for better scanning',
      },
    ],
    recommendations: [
      'Consider simplifying your design for better scanning reliability',
      'Increase contrast between foreground and background colors',
    ],
    suggestedECC: 'H' as const,
    contrastRatio: 4.2,
  },
  poor: {
    score: 35,
    issues: [
      {
        type: 'contrast' as const,
        severity: 'error' as const,
        message: 'Contrast ratio 1.7:1 is too low',
        suggestion: 'Minimum contrast ratio should be 4.5:1 for reliable scanning',
      },
      {
        type: 'logo_size' as const,
        severity: 'error' as const,
        message: 'Logo size 35% exceeds maximum',
        suggestion: 'Keep logo under 30% of QR code area',
      },
      {
        type: 'gradient_complexity' as const,
        severity: 'warning' as const,
        message: 'Using 5 gradient colors may affect scanning',
        suggestion: 'Limit gradients to 2-3 colors for best results',
      },
    ],
    recommendations: [
      'Consider simplifying your design for better scanning reliability',
      'Increase contrast between foreground and background colors',
      'Use high error correction (H) when including logos',
    ],
    suggestedECC: 'H' as const,
    contrastRatio: 1.7,
  },
};

export default function TestScannabilityPage() {
  const [currentScenario, setCurrentScenario] = useState<keyof typeof sampleAnalysis>('good');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Test de ScannabilityMeter</h1>
        <p className="text-gray-600">
          Prueba el componente de análisis de escaneabilidad con diferentes escenarios
        </p>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Escenarios de Prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={currentScenario === 'perfect' ? 'default' : 'outline'}
              onClick={() => setCurrentScenario('perfect')}
              className="gap-2"
            >
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Perfecto (100)
            </Button>
            <Button
              variant={currentScenario === 'good' ? 'default' : 'outline'}
              onClick={() => setCurrentScenario('good')}
              className="gap-2"
            >
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              Bueno (85)
            </Button>
            <Button
              variant={currentScenario === 'warning' ? 'default' : 'outline'}
              onClick={() => setCurrentScenario('warning')}
              className="gap-2"
            >
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              Advertencia (70)
            </Button>
            <Button
              variant={currentScenario === 'poor' ? 'default' : 'outline'}
              onClick={() => setCurrentScenario('poor')}
              className="gap-2"
            >
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Pobre (35)
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadingTest}
              disabled={isLoading}
            >
              Test Loading State
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista del Componente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Vista del Componente</CardTitle>
          </CardHeader>
          <CardContent>
            <ScannabilityMeter
              analysis={sampleAnalysis[currentScenario]}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Análisis (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(sampleAnalysis[currentScenario], null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Descripción de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Escaneabilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Factores Evaluados:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• <strong>Contraste (40%):</strong> Ratio entre colores usando WCAG 2.0</li>
                <li>• <strong>Tamaño del Logo (20%):</strong> Área ocupada por el logo</li>
                <li>• <strong>Complejidad del Patrón (20%):</strong> Patrones simples vs complejos</li>
                <li>• <strong>Visibilidad de Ojos (20%):</strong> Claridad de los marcadores de posición</li>
                <li>• <strong>Gradientes:</strong> Penalización adicional por complejidad</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Niveles de Score:</h3>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span><strong>90-100:</strong> Excelente escaneabilidad</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span><strong>70-89:</strong> Buena, con advertencias menores</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span><strong>0-69:</strong> Problemático, requiere cambios</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}