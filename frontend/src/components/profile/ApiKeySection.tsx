'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const handleCopyApiKey = () => {
    if (!currentApiKey) return;
    
    navigator.clipboard
      .writeText(currentApiKey)
      .then(() => {
        toast.success('API Key copiada al portapapeles');
      })
      .catch((err) => {
        console.error('Error al copiar API key:', err);
        toast.error('No se pudo copiar la API key');
      });
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
    <div className="bg-card p-6 border border-border rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-6">API Key</h3>

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
                    className="p-1 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label="Copiar API key"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {showApiKeyWarning && currentApiKey && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md text-sm">
              <strong>⚠️ Importante:</strong> Guarda tu API key en un lugar seguro. No podrás verla 
              de nuevo una vez que la ocultes.
            </div>
          )}

          {showApiGenerationSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
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
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {currentApiKey ? 'Regenerar API Key' : 'Generar API Key'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• La API key te permite usar el servicio programáticamente</p>
          <p>• Incluye la API key en el header: <code className="bg-muted px-1 rounded">x-api-key</code></p>
          <p>• Al regenerar una API key, la anterior dejará de funcionar inmediatamente</p>
        </div>
      </div>
    </div>
  );
} 