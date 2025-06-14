import { useState, useCallback } from 'react';
import { GenerateFormData } from '@/schemas/generate.schema';

interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
}

interface UseBarcodeGenerationReturn {
  svgContent: string;
  isLoading: boolean;
  serverError: ErrorResponse | null;
  generateBarcode: (formData: GenerateFormData) => Promise<void>;
  clearError: () => void;
}

export const useBarcodeGeneration = (): UseBarcodeGenerationReturn => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);

  const generateBarcode = useCallback(async (formData: GenerateFormData) => {
    const requestId = Date.now();
    console.log(`[generateBarcode-${requestId}] 🚀 INICIO - Datos validados recibidos:`, formData);
    
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const requestUrl = `${backendUrl}/api/generate`;
      
      // Obtener token de autenticación
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });

      const result = await response.json();

      if (!response.ok) {
        let message = 'Error desconocido al generar el código.';
        let code: string | undefined = undefined;
        let suggestion: string | undefined = undefined;

        if (result && typeof result.error === 'object' && result.error !== null) {
          message = result.error.message || message;
          code = result.error.code;
          suggestion = result.error.context?.suggestion;
        } else if (result && result.error && typeof result.error === 'string') {
          message = result.error;
        } else if (result && result.message) {
          message = result.message;
        }

        setServerError({
          success: false,
          error: message,
          suggestion,
          code,
        });
        setSvgContent('');
      } else {
        setSvgContent(result.svgString);
        setServerError(null);
      }
    } catch (err) {
      setServerError({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión o inesperado.',
      });
      setSvgContent('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setServerError(null);
  }, []);

  return {
    svgContent,
    isLoading,
    serverError,
    generateBarcode,
    clearError,
  };
};