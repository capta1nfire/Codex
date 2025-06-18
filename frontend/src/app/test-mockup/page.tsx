'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PreviewSection } from '@/components/generator/PreviewSectionV3';
import { useTypingTracker } from '@/hooks/useTypingTracker';
import { useBarcodeGenerationV2 } from '@/hooks/useBarcodeGenerationV2';
import { useSmartAutoGeneration } from '@/hooks/useSmartAutoGeneration';
import { Info } from 'lucide-react';

/**
 * Test page to demonstrate the sophisticated QR mockup system
 */
export default function TestMockupPage() {
  const [inputValue, setInputValue] = React.useState('');
  
  // Typing tracker
  const { isTyping, trackInput } = useTypingTracker({
    typingDebounceMs: 150,
    onStartTyping: () => console.log('[Test] User started typing'),
    onStopTyping: () => console.log('[Test] User stopped typing')
  });
  
  // Barcode generation
  const { 
    svgContent, 
    isLoading, 
    metadata, 
    isUsingV2 
  } = useBarcodeGenerationV2();
  
  // Smart auto-generation
  const {
    validateAndGenerate,
    validationError
  } = useSmartAutoGeneration({
    enabled: true
  });
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    trackInput(value);
    
    // Trigger auto-generation
    if (value.length > 0) {
      validateAndGenerate({
        barcode_type: 'qrcode',
        data: value,
        options: {
          scale: 2
        }
      }, 'url');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            QR Mockup System Demo
          </h1>
          <p className="text-slate-600">
            Watch how the placeholder appears while typing and transitions to real QR
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Enter URL or Text
                </label>
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
              
              {/* Status Indicators */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    isTyping ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                  }`} />
                  <span className="text-sm text-slate-600">
                    {isTyping ? 'User is typing...' : 'Ready'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full transition-colors ${
                    isLoading ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
                  }`} />
                  <span className="text-sm text-slate-600">
                    {isLoading ? 'Generating QR code...' : 'Generator idle'}
                  </span>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <p className="font-medium">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Start typing to see the placeholder QR appear</li>
                      <li>Placeholder shows while you're actively typing (150ms debounce)</li>
                      <li>Real QR generates after you stop typing (400ms debounce)</li>
                      <li>Smooth transition between states</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <div>
            <PreviewSection
              svgContent={svgContent}
              isLoading={isLoading}
              barcodeType="qrcode"
              isUsingV2={isUsingV2}
              showCacheIndicator={metadata?.fromCache}
              isUserTyping={isTyping}
              validationError={validationError}
            />
          </div>
        </div>

        {/* Debug Info */}
        <Card className="bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-sm font-mono">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs">
{JSON.stringify({
  isTyping,
  isLoading,
  hasContent: !!svgContent,
  inputLength: inputValue.length,
  validationError,
  timestamp: new Date().toLocaleTimeString()
}, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}