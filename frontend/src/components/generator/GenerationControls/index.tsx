/**
 * Generation Controls Component
 * 
 * Manages generation options and manual generation trigger.
 * Includes advanced options toggle and customization settings.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Settings2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GenerationOptions } from '@/types/generatorStates';
import GenerationOptionsComponent from '../GenerationOptions';
import { FrameEditor } from '../FrameEditor';

interface GenerationControlsProps {
  options: GenerationOptions;
  onOptionsChange: (options: Partial<GenerationOptions>) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  barcodeType: string;
  onOpenTemplates?: () => void;
  className?: string;
}

export function GenerationControls({
  options,
  onOptionsChange,
  onGenerate,
  canGenerate,
  isGenerating,
  barcodeType,
  onOpenTemplates,
  className
}: GenerationControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);


  // Handle batch option changes
  const handleBatchOptionChange = (newOptions: Partial<GenerationOptions>) => {
    onOptionsChange(newOptions);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Manual Generation Button */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          size="lg"
          className="min-w-[200px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generar Código
            </>
          )}
        </Button>

        {/* Template Gallery Button - Only for QR codes */}
        {barcodeType === 'qrcode' && onOpenTemplates && (
          <Button
            onClick={onOpenTemplates}
            variant="outline"
            size="lg"
            className="min-w-[200px] border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Usar Plantilla
          </Button>
        )}
      </div>

      {/* TODO: Add ScannabilityMeter here when scannability data is available from API
          <ScannabilityMeter 
            analysis={scannabilityData} 
            isLoading={isGenerating}
            className="mb-4"
          />
      */}

      {/* Advanced Options */}
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Personalización Avanzada
          </span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {showAdvanced && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <GenerationOptionsComponent
                options={options}
                onChange={handleBatchOptionChange}
                barcodeType={barcodeType}
              />

              {/* Frame Editor - Only for QR codes */}
              {barcodeType === 'qrcode' && (
                <FrameEditor
                  options={options.frame || {}}
                  onChange={(frameOptions) => handleBatchOptionChange({ frame: frameOptions })}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auto-generation indicator */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Los cambios se aplican automáticamente
        </span>
      </div>
    </div>
  );
}