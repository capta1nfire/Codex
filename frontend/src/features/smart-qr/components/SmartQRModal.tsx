/**
 * Smart QR Modal Component
 * Shows the analysis process and generation
 */

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Globe, 
  Palette, 
  Wand2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSmartQR } from '../hooks/useSmartQR';
import { SmartQRPreview } from './SmartQRPreview';

interface SmartQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onGenerate: (config: any) => void;
}

const STEP_ICONS = {
  'idle': Sparkles,
  'analyzing-url': Globe,
  'detecting-domain': Globe,
  'selecting-template': Palette,
  'applying-style': Wand2,
  'complete': CheckCircle2
};

export const SmartQRModal: React.FC<SmartQRModalProps> = ({
  isOpen,
  onClose,
  url,
  onGenerate
}) => {
  const {
    isAnalyzing,
    template,
    config,
    remaining,
    error,
    analysisState,
    limitStatus,
    generateSmartQR,
    reset
  } = useSmartQR({
    onComplete: (config) => {
      // Wait a bit to show the complete state
      setTimeout(() => {
        onGenerate(config);
      }, 500);
    },
    autoCheckLimit: true
  });

  // Start generation when modal opens
  useEffect(() => {
    if (isOpen && url) {
      generateSmartQR(url);
    }
  }, [isOpen, url]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleRetry = () => {
    if (url) {
      generateSmartQR(url);
    }
  };

  const StepIcon = STEP_ICONS[analysisState.currentStep] || Sparkles;
  const isComplete = analysisState.currentStep === 'complete';
  const hasError = !!error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            QR Inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL being analyzed */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Analizando:</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {url}
            </p>
          </div>

          {/* Analysis progress */}
          {isAnalyzing && !hasError && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className={cn(
                    "p-4 rounded-full bg-blue-100 dark:bg-blue-900/30",
                    "animate-pulse"
                  )}>
                    <StepIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  {analysisState.currentStep !== 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-16 w-16 text-blue-200 dark:text-blue-800 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-center text-sm font-medium text-gray-900 dark:text-gray-100">
                  {analysisState.message}
                </p>
                <Progress value={analysisState.progress} className="h-2" />
              </div>
            </div>
          )}

          {/* Success state */}
          {isComplete && !hasError && config && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ¡QR Inteligente generado!
                </p>
                {template && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Aplicado estilo: {template.name}
                  </p>
                )}
              </div>

              {/* Preview */}
              <SmartQRPreview config={config} />

              {/* Remaining uses */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Te quedan</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {remaining}
                </span>
                <span>usos hoy</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleRetry}
                  className="flex-1"
                  disabled={remaining === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {/* Limit warning */}
          {limitStatus && remaining <= 1 && remaining > 0 && !hasError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {remaining === 1 
                  ? 'Este es tu último QR inteligente del día'
                  : `Solo te quedan ${remaining} QR inteligentes hoy`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};