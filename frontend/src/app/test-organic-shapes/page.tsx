'use client';

import React, { useState } from 'react';
import { useQRGenerationV3Enhanced } from '@/hooks/useQRGenerationV3Enhanced';
import { QRV3Customization } from '@/hooks/useQRGenerationV3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EnhancedQRV3 } from '@/components/generator/EnhancedQRV3';

const ORGANIC_SHAPES = [
  { value: 'teardrop', label: 'Gota', icon: '💧', description: 'Asimétrica con punta arriba y base redondeada' },
  { value: 'wave', label: 'Onda', icon: '🌊', description: 'Bordes ondulados como agua' },
  { value: 'petal', label: 'Pétalo', icon: '🌸', description: 'Pétalo de flor suave' },
  { value: 'crystal', label: 'Cristal', icon: '💎', description: 'Cristal facetado con ángulos suaves' },
  { value: 'flame', label: 'Llama', icon: '🔥', description: 'Llama estilizada con movimiento' },
  { value: 'organic', label: 'Orgánico', icon: '🌿', description: 'Forma orgánica libre con variaciones' },
];

const EXAMPLE_INDUSTRIES = {
  teardrop: ['Wellness', 'Spas', 'Productos de belleza', 'Agua purificada'],
  wave: ['Surf', 'Deportes acuáticos', 'Wellness', 'Productos naturales'],
  petal: ['Floristerías', 'Bodas', 'Eventos románticos', 'Cosmética natural'],
  crystal: ['Joyerías', 'Marcas premium', 'Tech luxe', 'Arte'],
  flame: ['Restaurantes BBQ', 'Marcas energéticas', 'Eventos', 'Deportes'],
  organic: ['Productos orgánicos', 'Arte', 'Startups creativas', 'Eco-friendly'],
};

export default function TestOrganicShapesPage() {
  const { enhancedData, isLoading, error, metadata, generateEnhancedQR } = useQRGenerationV3Enhanced();
  
  const [data, setData] = useState('https://codex.capta.app');
  const [selectedShape, setSelectedShape] = useState<string>('teardrop');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');

  const handleGenerate = async (shape: string) => {
    const customization: QRV3Customization = {
      colors: {
        foreground: '#000000',
        background: '#FFFFFF',
      },
      eye_shape: shape,
      data_pattern: 'dots',
    };
    
    await generateEnhancedQR(data, {
      error_correction: errorCorrection,
      customization,
    });
  };

  const handleGenerateSelected = () => {
    handleGenerate(selectedShape);
  };

  const currentShape = ORGANIC_SHAPES.find(s => s.value === selectedShape);
  const currentIndustries = EXAMPLE_INDUSTRIES[selectedShape as keyof typeof EXAMPLE_INDUSTRIES] || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          🌿 Test Formas Orgánicas - Fase 2.1
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Control */}
          <div className="space-y-6">
            {/* Configuración Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Datos del QR</label>
                  <Input
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Corrección de Errores</label>
                  <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Selección de Forma */}
            <Card>
              <CardHeader>
                <CardTitle>Forma Orgánica Seleccionada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedShape} onValueChange={setSelectedShape}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIC_SHAPES.map(shape => (
                      <SelectItem key={shape.value} value={shape.value}>
                        <span className="flex items-center gap-2">
                          {shape.icon} {shape.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {currentShape && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      {currentShape.description}
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Industrias Target:</div>
                      <div className="flex flex-wrap gap-1">
                        {currentIndustries.map(industry => (
                          <Badge key={industry} variant="secondary" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerateSelected}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Generando...' : `Generar con ${currentShape.label}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Galería de Formas */}
            <Card>
              <CardHeader>
                <CardTitle>Galería de Formas Orgánicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {ORGANIC_SHAPES.map(shape => (
                    <Button
                      key={shape.value}
                      variant={selectedShape === shape.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedShape(shape.value);
                        handleGenerate(shape.value);
                      }}
                      disabled={isLoading}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-lg">{shape.icon}</span>
                      <span className="text-xs">{shape.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Vista Previa */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa QR Orgánico</CardTitle>
              </CardHeader>
              <CardContent>
                {enhancedData ? (
                  <div className="space-y-4">
                    <div className="flex justify-center p-8 bg-white rounded-lg shadow-inner">
                      <EnhancedQRV3
                        data={enhancedData}
                        totalModules={45}
                        dataModules={37}
                        version={5}
                        errorCorrection={errorCorrection}
                        size={300}
                        title={`QR Code - ${currentShape?.label}`}
                        description={`Contenido: ${data}`}
                      />
                    </div>
                    
                    {metadata && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Engine: {metadata.engine_version}</p>
                        <p>Tiempo de generación: {metadata.processing_time_ms}ms</p>
                        <p>Desde caché: {metadata.cached ? 'Sí' : 'No'}</p>
                        <p>Forma: {currentShape?.label} ({selectedShape})</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">
                        {isLoading ? 'Generando QR orgánico...' : 'Selecciona una forma para generar QR'}
                      </p>
                      {!isLoading && (
                        <div className="text-4xl mb-2">
                          {currentShape?.icon}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información Técnica */}
            <Card>
              <CardHeader>
                <CardTitle>Información Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Implementación:</span> SVG paths con curvas Bézier complejas
                  </div>
                  <div>
                    <span className="font-medium">Estructura:</span> Marco hueco 7x7 + centro 3x3
                  </div>
                  <div>
                    <span className="font-medium">Escaneabilidad:</span> Optimizada para &gt;95% compatibilidad
                  </div>
                  <div>
                    <span className="font-medium">Performance:</span> Mantiene &lt;5ms de generación
                  </div>
                  <div>
                    <span className="font-medium">Diferenciación:</span> Únicas en el mercado QR
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {enhancedData && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Datos Estructurados (Debug)</CardTitle>
              </CardHeader>
              <CardContent>
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 mb-2">
                    Ver estructura de datos Enhanced
                  </summary>
                  <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
                    {JSON.stringify(enhancedData, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}