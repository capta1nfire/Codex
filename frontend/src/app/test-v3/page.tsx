'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UltrathinkQR } from '@/components/generator/UltrathinkQR';
import { useQRGenerationV3 } from '@/hooks/useQRGenerationV3';

export default function TestV3Page() {
  const [inputData, setInputData] = useState('Test ULTRATHINK QR v3');
  const { structuredData, isLoading, error, generateQR, metadata } = useQRGenerationV3();
  const [directTestData, setDirectTestData] = useState<any>(null);
  const [directTestLoading, setDirectTestLoading] = useState(false);

  const handleGenerate = async () => {
    await generateQR(inputData, {
      error_correction: 'H',
    });
  };

  const handleDirectRustTest = async () => {
    setDirectTestLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/v3/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: inputData,
          options: {
            error_correction: 'H',
          },
        }),
      });
      const result = await response.json();
      console.log('Direct Rust v3 response:', result);
      
      if (result.success && result.data) {
        setDirectTestData(result.data);
      }
    } catch (err) {
      console.error('Direct Rust test error:', err);
    } finally {
      setDirectTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test ULTRATHINK QR v3</h1>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Nota:</strong> El botón "Generate via Express" requiere autenticación JWT. 
          Usa "Test Direct Rust" para probar sin autenticación directamente contra el servicio Rust.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Generate QR v3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Enter data to encode"
            />
            
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate via Express'}
              </Button>
              
              <Button onClick={handleDirectRustTest} variant="outline" disabled={directTestLoading}>
                {directTestLoading ? 'Testing...' : 'Test Direct Rust'}
              </Button>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            
            {metadata && (
              <div className="text-sm text-slate-600">
                <p>Engine: {metadata.engine_version}</p>
                <p>Cached: {metadata.cached ? 'Yes' : 'No'}</p>
                <p>Time: {metadata.processing_time_ms}ms</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>ULTRATHINK QR Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {(structuredData || directTestData) ? (
              <div className="space-y-4">
                <UltrathinkQR
                  data={structuredData || directTestData}
                  size={300}
                  title="ULTRATHINK QR Code"
                  description="Secure v3 implementation without dangerouslySetInnerHTML"
                />
                
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Total modules: {(structuredData || directTestData).total_modules}</p>
                  <p>Data modules: {(structuredData || directTestData).data_modules}</p>
                  <p>Version: {(structuredData || directTestData).version}</p>
                  <p>Error correction: {(structuredData || directTestData).error_correction}</p>
                  <p>Quiet zone: {(structuredData || directTestData).metadata.quiet_zone}</p>
                  {directTestData && !structuredData && (
                    <p className="text-yellow-600 font-semibold">⚠️ Direct Rust test (sin autenticación)</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-[300px] h-[300px] bg-slate-100 rounded flex items-center justify-center">
                <p className="text-slate-400">Generate QR to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}