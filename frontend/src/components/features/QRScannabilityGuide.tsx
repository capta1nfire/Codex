'use client';

import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Shield, 
  Zap, 
  Eye, 
  Palette, 
  Image,
  ArrowRight,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

export const QRScannabilityGuide: React.FC = () => {
  const router = useRouter();

  const scoringFactors = [
    {
      name: 'Contraste',
      weight: '40%',
      icon: <Palette className="w-5 h-5" />,
      description: 'Diferencia entre colores de fondo y primer plano',
      details: [
        { ratio: '< 3:1', penalty: '-40 puntos', severity: 'error' },
        { ratio: '< 4.5:1', penalty: '-20 puntos', severity: 'warning' },
        { ratio: '< 7:1', penalty: '-10 puntos', severity: 'info' },
        { ratio: '≥ 7:1', penalty: '0 puntos', severity: 'success' }
      ]
    },
    {
      name: 'Tamaño del Logo',
      weight: '20%',
      icon: <Image className="w-5 h-5" />,
      description: 'Área ocupada por el logo en el código QR',
      details: [
        { size: '> 30%', penalty: '-20 puntos', severity: 'error', suggestedECC: 'H' },
        { size: '> 25%', penalty: '-15 puntos', severity: 'warning', suggestedECC: 'H' },
        { size: '> 20%', penalty: '-10 puntos', severity: 'info', suggestedECC: 'H' },
        { size: '≤ 15%', penalty: '0 puntos', severity: 'success', suggestedECC: 'M' }
      ]
    },
    {
      name: 'Complejidad del Patrón',
      weight: '20%',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Diseño de los módulos de datos',
      details: [
        { pattern: 'wave, mosaic, random', penalty: '-10 puntos', severity: 'warning' },
        { pattern: 'star, cross, circular', penalty: '-5 puntos', severity: 'info' },
        { pattern: 'square, dots, rounded', penalty: '0 puntos', severity: 'success' }
      ]
    },
    {
      name: 'Visibilidad de Ojos',
      weight: '20%',
      icon: <Eye className="w-5 h-5" />,
      description: 'Claridad de los marcadores de posición',
      details: [
        { style: 'star, leaf, arrow', penalty: '-10 puntos', severity: 'warning' },
        { style: 'cross, hexagon', penalty: '-5 puntos', severity: 'info' },
        { style: 'square, circle, rounded', penalty: '0 puntos', severity: 'success' }
      ]
    },
    {
      name: 'Complejidad del Gradiente',
      weight: 'Bonus',
      icon: <Zap className="w-5 h-5" />,
      description: 'Penalización adicional por gradientes complejos',
      details: [
        { type: 'conic, spiral', penalty: '-5 puntos', severity: 'info' },
        { type: '> 3 colores', penalty: '-5 puntos', severity: 'info' },
        { type: 'En ojos/marcadores', penalty: '-5 puntos', severity: 'warning' },
        { type: 'Linear/radial simple', penalty: '0 puntos', severity: 'success' }
      ]
    }
  ];

  const scoreRanges = [
    {
      range: '90-100',
      label: 'Excelente',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />,
      description: 'Diseño óptimo para escaneo rápido y confiable en cualquier condición'
    },
    {
      range: '70-89',
      label: 'Bueno',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
      description: 'Escaneable en la mayoría de condiciones, con margen de mejora'
    },
    {
      range: '0-69',
      label: 'Comprometido',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
      description: 'Puede presentar problemas de escaneo, se recomienda simplificar'
    }
  ];

  const bestPractices = [
    {
      title: 'Mantén Alto Contraste',
      description: 'Usa colores con ratio de contraste mínimo 4.5:1 para garantizar lectura',
      recommendation: 'Negro sobre blanco o combinaciones de alta diferencia'
    },
    {
      title: 'Logos Moderados',
      description: 'Limita el logo a máximo 20% del área total del QR',
      recommendation: 'Usa corrección de errores alta (H) cuando incluyas logos'
    },
    {
      title: 'Patrones Simples',
      description: 'Prefiere patrones de datos básicos como cuadrados o puntos',
      recommendation: 'Evita patrones ornamentales que pueden confundir al escáner'
    },
    {
      title: 'Marcadores Claros',
      description: 'Mantén los ojos del QR con formas estructurales reconocibles',
      recommendation: 'Usa formas cuadradas, circulares o redondeadas'
    },
    {
      title: 'Gradientes Sutiles',
      description: 'Si usas gradientes, limítalos a 2-3 colores en transiciones suaves',
      recommendation: 'Aplica gradientes solo a los módulos de datos, no a los marcadores'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              Característica Exclusiva
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sistema de Escaneabilidad QR
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Tecnología avanzada que analiza en tiempo real tu diseño QR y garantiza 
              la máxima tasa de escaneo exitoso sin sacrificar creatividad
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => router.push('/')}
                className="bg-white text-blue-700 hover:bg-blue-50"
              >
                Probar Generador
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white border border-white/50 hover:bg-white/20 hover:text-white hover:border-white"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Cómo Funciona
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 py-12">
        {/* What is Scannability Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-2xl">¿Qué es la Escaneabilidad?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                La escaneabilidad es una métrica que evalúa qué tan fácil y confiablemente 
                un código QR puede ser leído por diferentes dispositivos y aplicaciones de escaneo. 
                Nuestro sistema analiza múltiples factores técnicos basados en el estándar 
                ISO/IEC 18004 para asegurar que tu código QR funcione perfectamente.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">100ms</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Análisis en tiempo real</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">5</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Factores analizados</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">ISO</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Basado en estándares</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Cómo Funciona el Sistema</h2>
          
          <Tabs defaultValue="factors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="factors">Factores</TabsTrigger>
              <TabsTrigger value="scoring">Puntuación</TabsTrigger>
              <TabsTrigger value="standards">Estándares</TabsTrigger>
            </TabsList>

            <TabsContent value="factors" className="space-y-6 mt-6">
              {scoringFactors.map((factor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          {factor.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{factor.name}</CardTitle>
                          <CardDescription>{factor.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        Peso: {factor.weight}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {factor.details.map((detail, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded ${
                            detail.severity === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                            detail.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                            detail.severity === 'info' ? 'bg-blue-50 dark:bg-blue-900/20' :
                            'bg-green-50 dark:bg-green-900/20'
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {'ratio' in detail && detail.ratio}
                            {'size' in detail && detail.size}
                            {'pattern' in detail && detail.pattern}
                            {'style' in detail && detail.style}
                            {'type' in detail && detail.type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${
                              detail.severity === 'error' ? 'text-red-600 dark:text-red-400' :
                              detail.severity === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                              detail.severity === 'info' ? 'text-blue-600 dark:text-blue-400' :
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {detail.penalty}
                            </span>
                            {'suggestedECC' in detail && detail.suggestedECC && (
                              <Badge variant="outline" className="text-xs">
                                ECC: {detail.suggestedECC}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sistema de Puntuación
                  </CardTitle>
                  <CardDescription>
                    El score final se calcula en base a 100 puntos menos las penalizaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {scoreRanges.map((range, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${range.bgColor} ${range.borderColor}`}
                    >
                      <div className="flex items-start gap-3">
                        {range.icon}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold ${range.color}`}>
                              {range.label}
                            </h3>
                            <Badge variant="outline" className={range.color}>
                              {range.range} puntos
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {range.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      Fórmula de Cálculo
                    </h4>
                    <code className="text-sm text-blue-600 dark:text-blue-400">
                      Score = 100 - (Penalizaciones de Contraste + Logo + Patrón + Ojos + Gradiente)
                    </code>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="standards" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Base Técnica y Estándares</CardTitle>
                  <CardDescription>
                    Nuestro sistema está basado en estándares internacionales reconocidos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">ISO/IEC 18004:2015</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Estándar internacional para códigos QR que define los requisitos 
                        de calidad, estructura y legibilidad.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">WCAG 2.0 - Contraste</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Utilizamos la fórmula de luminancia relativa de las Pautas de 
                        Accesibilidad para el Contenido Web para calcular ratios de contraste.
                      </p>
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                        Ratio = (L1 + 0.05) / (L2 + 0.05)
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold mb-2">Corrección de Errores Reed-Solomon</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recomendaciones de nivel ECC basadas en el porcentaje de oclusión:
                      </p>
                      <ul className="mt-2 text-sm space-y-1">
                        <li>• L (7%) - Sin logos o mínima personalización</li>
                        <li>• M (15%) - Logos pequeños, diseño simple</li>
                        <li>• Q (25%) - Logos medianos, patrones moderados</li>
                        <li>• H (30%) - Logos grandes, diseño complejo</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Best Practices Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Mejores Prácticas</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{practice.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    {practice.description}
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      💡 {practice.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Visual Examples Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Ejemplos Visuales</CardTitle>
              <CardDescription className="text-center">
                Comparación de códigos QR con diferentes niveles de escaneabilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Example 1: Perfect Score */}
                <div className="text-center space-y-3">
                  <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg flex items-center justify-center">
                    <div className="p-8">
                      <CheckCircle className="w-24 h-24 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">100</span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                    <h3 className="font-semibold">Diseño Óptimo</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alto contraste, sin logo, patrón simple
                    </p>
                  </div>
                </div>

                {/* Example 2: Good Score */}
                <div className="text-center space-y-3">
                  <div className="aspect-square bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg flex items-center justify-center">
                    <div className="p-8">
                      <AlertCircle className="w-24 h-24 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">75</span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                    <h3 className="font-semibold">Diseño Balanceado</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Logo moderado, gradiente simple
                    </p>
                  </div>
                </div>

                {/* Example 3: Poor Score */}
                <div className="text-center space-y-3">
                  <div className="aspect-square bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg flex items-center justify-center">
                    <div className="p-8">
                      <XCircle className="w-24 h-24 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">45</span>
                      <span className="text-sm text-gray-500">/100</span>
                    </div>
                    <h3 className="font-semibold">Diseño Problemático</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bajo contraste, logo grande, patrón complejo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">
                Crea QR Codes Perfectos
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Utiliza nuestro generador con sistema de escaneabilidad integrado para 
                crear códigos QR creativos y altamente funcionales.
              </p>
              <Button
                size="lg"
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Comenzar a Generar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default QRScannabilityGuide;