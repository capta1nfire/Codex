'use client';

import React, { useState } from 'react';
import { FrameEditor, FrameOptions } from '@/components/generator/FrameEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestFrameEditorPage() {
  const [frameOptions, setFrameOptions] = useState<Partial<FrameOptions>>({
    enabled: true,
    frame_type: 'simple',
    text: 'Escanéame',
    text_size: 14,
    text_font: 'Arial',
    color: '#000000',
    background_color: '#FFFFFF',
    text_position: 'bottom',
    padding: 10,
    border_width: 2,
    corner_radius: 0,
  });

  const handleFrameChange = (options: Partial<FrameOptions>) => {
    setFrameOptions(options);
    console.log('Frame options updated:', options);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Test Frame Editor
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Frame Editor */}
          <div>
            <FrameEditor
              options={frameOptions}
              onChange={handleFrameChange}
            />
          </div>

          {/* Preview and Debug */}
          <div className="space-y-4">
            {/* Visual Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Marco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-100 p-8 rounded-lg">
                  {/* QR Code Placeholder */}
                  <div className="bg-white p-4 rounded shadow-sm">
                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">QR Code</span>
                    </div>
                  </div>

                  {/* Frame Preview */}
                  {frameOptions.enabled && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        border: `${frameOptions.border_width}px solid ${frameOptions.color}`,
                        borderRadius: frameOptions.frame_type === 'rounded' ? `${frameOptions.corner_radius}px` : '0',
                        backgroundColor: frameOptions.background_color,
                        padding: `${frameOptions.padding}px`,
                      }}
                    >
                      <div
                        className={`absolute ${
                          frameOptions.text_position === 'top' ? 'top-2 left-1/2 -translate-x-1/2' :
                          frameOptions.text_position === 'bottom' ? 'bottom-2 left-1/2 -translate-x-1/2' :
                          frameOptions.text_position === 'left' ? 'left-2 top-1/2 -translate-y-1/2 -rotate-90' :
                          'right-2 top-1/2 -translate-y-1/2 rotate-90'
                        }`}
                        style={{
                          color: frameOptions.color,
                          fontSize: `${frameOptions.text_size}px`,
                          fontFamily: frameOptions.text_font,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {frameOptions.text}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* JSON Output */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(frameOptions, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* API Request Example */}
            <Card>
              <CardHeader>
                <CardTitle>Ejemplo de Request API</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
{`POST /api/v3/qr/generate
{
  "data": "https://example.com",
  "options": {
    "customization": {
      "frame": ${JSON.stringify(frameOptions, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}
    }
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}