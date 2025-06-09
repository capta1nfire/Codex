/**
 * Enhanced barcode generation hook with QR Engine v2 integration
 * Provides backward compatibility while leveraging v2 features for QR codes
 */

import { useState, useCallback } from 'react';
import { GenerateFormData } from '@/schemas/generate.schema';
import { useAuth } from '@/hooks/useAuth';
import { getQREngineV2, QRv2Options } from '@/lib/qr-engine-v2';
import { shouldUseV2, migrateQRRequest, convertV2ResponseToOld } from '@/lib/qr-migration';

interface ErrorResponse {
  success: boolean;
  error: string;
  suggestion?: string;
  code?: string;
}

interface GenerationMetadata {
  generationTimeMs?: number;
  fromCache?: boolean;
  engineVersion?: string;
  complexityLevel?: string;
  qualityScore?: number;
}

interface UseBarcodeGenerationReturn {
  svgContent: string;
  isLoading: boolean;
  serverError: ErrorResponse | null;
  metadata: GenerationMetadata | null;
  generateBarcode: (formData: GenerateFormData) => Promise<void>;
  clearError: () => void;
  isUsingV2: boolean;
}

export const useBarcodeGenerationV2 = (): UseBarcodeGenerationReturn => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [isUsingV2, setIsUsingV2] = useState(false);
  const { user } = useAuth();

  const generateBarcode = useCallback(async (formData: GenerateFormData) => {
    const requestId = Date.now();
    console.log(`[generateBarcode-${requestId}] 🚀 INICIO - Datos validados recibidos:`, formData);
    
    setServerError(null);
    setIsLoading(true);
    setSvgContent('');
    setMetadata(null);

    const payload = {
      barcode_type: formData.barcode_type,
      data: formData.data,
      options: formData.options || {},
    };

    try {
      // Check if we should use v2 for this request
      const useV2 = shouldUseV2(payload);
      setIsUsingV2(useV2);

      if (useV2 && (payload.barcode_type === 'qrcode' || payload.barcode_type === 'qr')) {
        // Use QR Engine v2
        console.log(`[generateBarcode-${requestId}] Using QR Engine v2`);
        
        const qrClient = getQREngineV2(user?.token || localStorage.getItem('authToken') || undefined);
        
        // Convert old format to v2 format
        const v2Request = migrateQRRequest(payload);
        
        // Add any v2-specific options if they exist in formData
        if (formData.options) {
          const opts = formData.options as any;
          const v2Options: Partial<QRv2Options> = {};
          
          // Map additional v2 options
          if (opts.eyeShape) v2Options.eyeShape = opts.eyeShape;
          if (opts.dataPattern) v2Options.dataPattern = opts.dataPattern;
          if (opts.eyeColor) v2Options.eyeColor = opts.eyeColor;
          
          // Effects
          if (opts.effects && Array.isArray(opts.effects)) {
            v2Options.effects = opts.effects;
          }
          
          // Frame
          if (opts.frame) {
            v2Options.frame = opts.frame;
          }
          
          // Merge with migrated options
          v2Request.options = { ...v2Request.options, ...v2Options };
        }
        
        const v2Response = await qrClient.generate(v2Request);
        
        if (v2Response.success) {
          setSvgContent(v2Response.svg);
          setMetadata({
            generationTimeMs: v2Response.metadata.processingTimeMs,
            fromCache: v2Response.cached,
            engineVersion: '2.0.0',
            complexityLevel: v2Response.metadata.complexityLevel,
            qualityScore: v2Response.metadata.qualityScore,
          });
          setServerError(null);
        } else {
          throw new Error('QR generation failed');
        }
      } else {
        // Use old API for non-QR codes or if v2 is disabled
        console.log(`[generateBarcode-${requestId}] Using legacy API`);
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
        const requestUrl = `${backendUrl}/api/generate`;
        
        const token = user?.token || localStorage.getItem('authToken');
        
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
          signal: AbortSignal.timeout(10000),
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
          setSvgContent(result.svgString || result.svg);
          setMetadata({
            generationTimeMs: result.metadata?.generation_time_ms,
            fromCache: result.metadata?.from_cache || result.cached,
            engineVersion: '1.0.0',
          });
          setServerError(null);
        }
      }
    } catch (err) {
      console.error(`[generateBarcode-${requestId}] Error:`, err);
      setServerError({
        success: false,
        error: err instanceof Error ? err.message : 'Error de conexión o inesperado.',
      });
      setSvgContent('');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setServerError(null);
  }, []);

  return {
    svgContent,
    isLoading,
    serverError,
    metadata,
    generateBarcode,
    clearError,
    isUsingV2,
  };
};