'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Copy, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClipboard } from '@/hooks/useClipboard';

interface ApiKeySectionProps {
  currentApiKey?: string;
  isLoading: boolean;
  onGenerateApiKey: () => Promise<void>;
}

export default function ApiKeySection({ 
  currentApiKey, 
  isLoading, 
  onGenerateApiKey 
}: ApiKeySectionProps) {
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const [showApiGenerationSuccess, setShowApiGenerationSuccess] = useState(false);
  
  const { copy, copied, isSupported } = useClipboard();

  const handleCopyApiKey = async () => {
    if (!currentApiKey) return;
    
    const success = await copy(currentApiKey);
    
    if (success) {
      toast.success('API Key copiada al portapapeles');
    } else {
      toast.error('No se pudo copiar la API key. Intenta seleccionar y copiar manualmente.');
    }
  };

  const toggleApiKeyVisibility = () => {
    const nextVisibility = !isApiKeyVisible;
    setIsApiKeyVisible(nextVisibility);
    setShowApiGenerationSuccess(false);
    setShowApiKeyWarning(nextVisibility);
  };

  const handleGenerateApiKey = async () => {
    setIsApiKeyVisible(false);
    setShowApiKeyWarning(false);
    setShowApiGenerationSuccess(false);
    
    await onGenerateApiKey();
    
    setShowApiGenerationSuccess(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-700 rounded-lg shadow-corporate-md hover:shadow-corporate-lg transition-all duration-200">
      <h3 className="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100">API Key</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key Actual</Label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={isApiKeyVisible ? 'text' : 'password'}
                value={currentApiKey || 'No hay API key generada'}
                readOnly
                className="pr-20"
              />
              {currentApiKey && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    type="button"
                    onClick={toggleApiKeyVisibility}
                    className="p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={isApiKeyVisible ? 'Ocultar API key' : 'Mostrar API key'}
                  >
                    {isApiKeyVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className={`p-1 transition-colors focus:outline-none ${
                      copied 
                        ? 'text-corporate-blue-600 hover:text-corporate-blue-700' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label={copied ? 'API key copiada' : 'Copiar API key'}
                    disabled={!isSupported}
                    title={
                      !isSupported 
                        ? 'Copiar no disponible en este navegador'
                        : copied 
                        ? 'API key copiada'
                        : 'Copiar API key'
                    }
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {showApiKeyWarning && currentApiKey && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-md text-sm">
              <strong>⚠️ Importante:</strong> Guarda tu API key en un lugar seguro. No podrás verla 
              de nuevo una vez que la ocultes.
            </div>
          )}

          {showApiGenerationSuccess && (
            <div className="bg-corporate-blue-50 dark:bg-corporate-blue-950 border border-corporate-blue-200 dark:border-corporate-blue-800 text-corporate-blue-800 dark:text-corporate-blue-200 px-3 py-2 rounded-md text-sm">
              <strong>✅ Éxito:</strong> Nueva API key generada correctamente. Asegúrate de copiarla 
              y guardarla en un lugar seguro.
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleGenerateApiKey}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto border-corporate-blue-300 hover:bg-corporate-blue-50 dark:border-corporate-blue-700 dark:hover:bg-corporate-blue-950"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {currentApiKey ? 'Regenerar API Key' : 'Generar API Key'}
          </Button>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <p>• La API key te permite usar el servicio programáticamente</p>
          <p>• Incluye la API key en el header: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-corporate-blue-600 dark:text-corporate-blue-400">x-api-key</code></p>
          <p>• Al regenerar una API key, la anterior dejará de funcionar inmediatamente</p>
        </div>
      </div>
    </div>
  );
} 