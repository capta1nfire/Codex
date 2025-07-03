'use client';

import React, { useState } from 'react';
import { EnhancedQRV3 } from '@/components/generator/EnhancedQRV3';
import { useQRGenerationV3Enhanced } from '@/hooks/useQRGenerationV3Enhanced';
import { QRV3Customization } from '@/hooks/useQRGenerationV3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestV3EnhancedPage() {
  const { enhancedData, isLoading, error, metadata, generateEnhancedQR, clearData } = useQRGenerationV3Enhanced();
  
  // Estado del formulario
  const [data, setData] = useState('https://codex.capta.app');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  
  // Customización
  const [gradientEnabled, setGradientEnabled] = useState(true);
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic' | 'diamond' | 'spiral'>('radial');
  const [gradientColors, setGradientColors] = useState(['#FF0066', '#6600FF']);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [applyToData, setApplyToData] = useState(true);
  const [applyToEyes, setApplyToEyes] = useState(true);
  
  const [eyeShape, setEyeShape] = useState('rounded_square');
  const [dataPattern, setDataPattern] = useState('dots');
  
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [glowEnabled, setGlowEnabled] = useState(false);
  
  // Colores básicos
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  const handleGenerate = async () => {
    const customization: QRV3Customization = {
      colors: {
        foreground: foregroundColor,
        background: backgroundColor,
      },
      eye_shape: eyeShape,
      data_pattern: dataPattern,
      effects: [],
    };
    
    // Agregar gradiente si está habilitado
    if (gradientEnabled) {
      customization.gradient = {
        enabled: true,
        gradient_type: gradientType,
        colors: gradientColors,
        angle: gradientType === 'linear' ? gradientAngle : undefined,
        apply_to_data: applyToData,
        apply_to_eyes: applyToEyes,
      };
    }
    
    // Agregar efectos
    if (shadowEnabled) {
      customization.effects?.push({
        effect_type: 'shadow',
        config: {},
      });
    }
    
    if (glowEnabled) {
      customization.effects?.push({
        effect_type: 'glow',
        config: { color: '#FFFF00' },
      });
    }
    
    await generateEnhancedQR(data, {
      error_correction: errorCorrection,
      customization,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          QR v3 Enhanced - Test Page
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Configuración */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Enhanced</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="gradient">Gradientes</TabsTrigger>
                  <TabsTrigger value="shapes">Formas</TabsTrigger>
                  <TabsTrigger value="effects">Efectos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="data">Datos del QR</Label>
                    <Input
                      id="data"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="error-correction">Corrección de Errores</Label>
                    <Select value={errorCorrection} onValueChange={(v) => setErrorCorrection(v as any)}>
                      <SelectTrigger id="error-correction">
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
                  
                  <div className="space-y-2">
                    <Label>Colores Base (sin gradiente)</Label>
                    <div className="flex gap-4">
                      <div>
                        <Label htmlFor="fg-color" className="text-xs">Foreground</Label>
                        <Input
                          id="fg-color"
                          type="color"
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          className="w-20 h-10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bg-color" className="text-xs">Background</Label>
                        <Input
                          id="bg-color"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-20 h-10"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="gradient" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="gradient-enabled"
                      checked={gradientEnabled}
                      onCheckedChange={setGradientEnabled}
                    />
                    <Label htmlFor="gradient-enabled">Habilitar Gradiente</Label>
                  </div>
                  
                  {gradientEnabled && (
                    <>
                      <div>
                        <Label htmlFor="gradient-type">Tipo de Gradiente</Label>
                        <Select value={gradientType} onValueChange={(v) => setGradientType(v as any)}>
                          <SelectTrigger id="gradient-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="radial">Radial</SelectItem>
                            <SelectItem value="conic">Conic</SelectItem>
                            <SelectItem value="diamond">Diamond</SelectItem>
                            <SelectItem value="spiral">Spiral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {gradientType === 'linear' && (
                        <div>
                          <Label htmlFor="gradient-angle">Ángulo: {gradientAngle}°</Label>
                          <Slider
                            id="gradient-angle"
                            min={0}
                            max={360}
                            step={15}
                            value={[gradientAngle]}
                            onValueChange={([v]) => setGradientAngle(v)}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Colores del Gradiente</Label>
                        <div className="flex gap-2">
                          {gradientColors.map((color, index) => (
                            <Input
                              key={index}
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...gradientColors];
                                newColors[index] = e.target.value;
                                setGradientColors(newColors);
                              }}
                              className="w-16 h-10"
                            />
                          ))}
                          {gradientColors.length < 5 && (
                            <Button
                              size="sm"
                              onClick={() => setGradientColors([...gradientColors, '#00FFCC'])}
                            >
                              +
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Aplicar Gradiente a:</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="apply-data"
                            checked={applyToData}
                            onCheckedChange={setApplyToData}
                          />
                          <Label htmlFor="apply-data">Datos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="apply-eyes"
                            checked={applyToEyes}
                            onCheckedChange={setApplyToEyes}
                          />
                          <Label htmlFor="apply-eyes">Ojos</Label>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="shapes" className="space-y-4">
                  <div>
                    <Label htmlFor="eye-shape">Forma de Ojos</Label>
                    <Select value={eyeShape} onValueChange={setEyeShape}>
                      <SelectTrigger id="eye-shape">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="rounded_square">Rounded Square</SelectItem>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="dot">Dot</SelectItem>
                        <SelectItem value="leaf">Leaf</SelectItem>
                        <SelectItem value="star">Star</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="heart">Heart</SelectItem>
                        <SelectItem value="shield">Shield</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="data-pattern">Patrón de Datos</Label>
                    <Select value={dataPattern} onValueChange={setDataPattern}>
                      <SelectTrigger id="data-pattern">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                        <SelectItem value="star">Star</SelectItem>
                        <SelectItem value="cross">Cross</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                        <SelectItem value="mosaic">Mosaic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="effects" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shadow-enabled"
                      checked={shadowEnabled}
                      onCheckedChange={setShadowEnabled}
                    />
                    <Label htmlFor="shadow-enabled">Sombra</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="glow-enabled"
                      checked={glowEnabled}
                      onCheckedChange={setGlowEnabled}
                    />
                    <Label htmlFor="glow-enabled">Glow</Label>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 space-y-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Generando...' : 'Generar QR Enhanced'}
                </Button>
                
                {enhancedData && (
                  <Button 
                    onClick={clearData} 
                    variant="outline"
                    className="w-full"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Panel de Vista Previa */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa Enhanced</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedData ? (
                <div className="space-y-4">
                  <div className="flex justify-center p-8 bg-white rounded-lg shadow-inner">
                    <EnhancedQRV3
                      data={enhancedData}
                      totalModules={45} // Estos valores deberían venir del backend
                      dataModules={37}
                      version={5}
                      errorCorrection={errorCorrection}
                      size={300}
                      title="QR Code Enhanced"
                      description={`Contenido: ${data}`}
                    />
                  </div>
                  
                  {metadata && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Engine: {metadata.engine_version}</p>
                      <p>Tiempo de generación: {metadata.processing_time_ms}ms</p>
                      <p>Desde caché: {metadata.cached ? 'Sí' : 'No'}</p>
                    </div>
                  )}
                  
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Ver estructura de datos Enhanced
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-96">
                      {JSON.stringify(enhancedData, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg">
                  <p className="text-gray-500">
                    {isLoading ? 'Generando QR Enhanced...' : 'Configure y genere un QR'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}