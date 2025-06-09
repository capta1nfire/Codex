'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQREngineV2 } from '@/hooks/useQREngineV2';
import { PreviewSection } from '@/components/generator/PreviewSectionV2';
import { Zap, Loader2 } from 'lucide-react';

export default function TestV2Page() {
  const [data, setData] = useState('https://codex.com');
  const [options, setOptions] = useState({
    size: 300,
    eyeShape: 'circle' as const,
    dataPattern: 'dots' as const,
    foregroundColor: '#1E40AF',
    backgroundColor: '#FFFFFF',
  });

  const { 
    loading, 
    error, 
    result, 
    generate, 
    getPreviewUrl 
  } = useQREngineV2();

  const handleGenerate = async () => {
    await generate(data, options);
  };

  const previewUrl = getPreviewUrl(data, options);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">QR Engine v2 Test</h1>
        <p className="text-muted-foreground">Test the new high-performance QR generation engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configuration
              <Badge variant="secondary" className="gap-1">
                <Zap className="w-3 h-3" />
                v2 Engine
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data</label>
              <Input
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter URL or text..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <Input
                  type="number"
                  value={options.size}
                  onChange={(e) => setOptions({ ...options, size: parseInt(e.target.value) })}
                  min={100}
                  max={1000}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Eye Shape</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={options.eyeShape}
                  onChange={(e) => setOptions({ ...options, eyeShape: e.target.value as any })}
                >
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                  <option value="rounded">Rounded</option>
                  <option value="dot">Dot</option>
                  <option value="leaf">Leaf</option>
                  <option value="star">Star</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Pattern</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={options.dataPattern}
                  onChange={(e) => setOptions({ ...options, dataPattern: e.target.value as any })}
                >
                  <option value="square">Square</option>
                  <option value="dots">Dots</option>
                  <option value="rounded">Rounded</option>
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Colors</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={options.foregroundColor}
                    onChange={(e) => setOptions({ ...options, foregroundColor: e.target.value })}
                    className="w-full h-10"
                  />
                  <input
                    type="color"
                    value={options.backgroundColor}
                    onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                    className="w-full h-10"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate QR Code'
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <div>
          <PreviewSection
            svgContent={result?.svg || ''}
            isLoading={loading}
            barcodeType="qrcode"
            isUsingV2={true}
            showCacheIndicator={result?.cached}
          />

          {/* Real-time preview URL */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Real-time Preview URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <img 
                  src={previewUrl} 
                  alt="QR Preview" 
                  className="w-full max-w-[200px] mx-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 break-all">
                {previewUrl}
              </p>
            </CardContent>
          </Card>

          {/* Metadata */}
          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Generation Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Processing Time:</dt>
                    <dd className="font-medium">{result.metadata.processingTimeMs}ms</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Complexity:</dt>
                    <dd className="font-medium">{result.metadata.complexityLevel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Quality Score:</dt>
                    <dd className="font-medium">{result.metadata.qualityScore}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Version:</dt>
                    <dd className="font-medium">{result.metadata.version}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Cached:</dt>
                    <dd className="font-medium">{result.cached ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}