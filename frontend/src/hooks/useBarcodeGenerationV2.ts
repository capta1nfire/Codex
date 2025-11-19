/**
 * Enhanced barcode generation hook with API v1/v3 integration
 *
 * API Structure:
 * - QR CODES: /api/v3/qr (high-performance v3 engine)
 * - OTHER BARCODES: /api/v1/barcode (standard engine)
 *
 * Legacy endpoints (/api/generate, /api/qr) remain functional
 * with deprecation warnings for backward compatibility.
 *
 * Note: Hook maintains "V2" name for backward compatibility but uses v3 endpoints
 */

import { useState, useCallback } from 'react';
import { GenerateFormData } from '@/schemas/generate.schema';
import { shouldUseV2, migrateQRRequest } from '@/lib/qr-migration';

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
  clearContent: () => void;
  isUsingV2: boolean;
}

export const useBarcodeGenerationV2 = (): UseBarcodeGenerationReturn => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<ErrorResponse | null>(null);
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [isUsingV2, setIsUsingV2] = useState(false);

  const generateBarcode = useCallback(async (formData: GenerateFormData) => {
    console.log('[useBarcodeGenerationV2] generateBarcode called with:', formData);
    const requestId = Date.now();
    // Generate barcode with validated data
    
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

      if (payload.barcode_type === 'qrcode' || payload.barcode_type === 'qr') {
        // ALWAYS use QR Engine v3 for QR codes
        // Use QR Engine v3 for QR codes
        setIsUsingV2(true); // Keep this true for backward compatibility with UI indicators

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const requestUrl = `${backendUrl}/api/v3/qr/generate`;

        // Convert old format to v3 format
        const v3Request = migrateQRRequest(payload);
        console.log('[useBarcodeGenerationV2] v3Request after migration:', v3Request);
        
        // Add gradient options if present
        if (formData.options) {
          const opts = formData.options as any;
          
          // Process gradient options if enabled
          
          // Handle gradients properly
          if (opts.gradient_enabled) {
            v3Request.options = v3Request.options || {};

            v3Request.options.gradient = {
              type: opts.gradient_type || 'linear',
              colors: [opts.gradient_color1 || '#000000', opts.gradient_color2 || '#666666'],
              angle: opts.gradient_direction === 'left-right' ? 0 : 
                     opts.gradient_direction === 'diagonal' ? 45 : 
                     opts.gradient_direction === 'center-out' ? 0 : 90,
              applyToData: true,
              applyToEyes: false
            };
            
            // Override colors when gradient is enabled
            if (v3Request.options.gradient.colors && v3Request.options.gradient.colors.length > 0) {
              v3Request.options.foregroundColor = v3Request.options.gradient.colors[0];
            }
          }

          // Map additional v3 options
          if (opts.eyeShape) v3Request.options!.eyeShape = opts.eyeShape;
          if (opts.dataPattern) v3Request.options!.dataPattern = opts.dataPattern;
          if (opts.eyeColor) v3Request.options!.eyeColor = opts.eyeColor;
          
          // Map effects if present
          if (opts.effects) {
            v3Request.options!.effects = [];
            
            // Check each effect type
            ['shadow', 'glow', 'blur', 'noise', 'vintage'].forEach((effectType) => {
              const effect = opts.effects?.[effectType];
              if (effect?.enabled) {
                v3Request.options!.effects!.push({
                  type: effectType,
                  intensity: effect.intensity || 1.0,
                  ...(effect.color && { color: effect.color })
                });
              }
            });
          }
          
          // Map frame options
          if (opts.frame?.style && opts.frame.style !== 'none') {
            v3Request.options!.frame = {
              style: opts.frame.style,
              text: opts.frame.text,
              color: opts.frame.color || '#000000',
              textPosition: opts.frame.text_position || 'bottom'
            };
          }
        }
        
        const token = localStorage.getItem('authToken');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Send request to v3 API
        console.log('[useBarcodeGenerationV2] Final v3Request being sent:', JSON.stringify(v3Request, null, 2));

        const response = await fetch(requestUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(v3Request),
          signal: AbortSignal.timeout(10000),
        });

        const result = await response.json();
        console.log('[useBarcodeGenerationV2] v3 API response:', {
          success: result.success,
          hasSvg: !!result.svg,
          svgLength: result.svg?.length,
          keys: Object.keys(result),
          fullResponse: result
        });
        
        if (!response.ok) {
          throw new Error(result.error || 'QR generation failed');
        }
        
        // Check different possible response formats
        const svgData = result.svg || result.data || result.svgString;
        console.log('[useBarcodeGenerationV2] SVG data found:', svgData ? 'Yes' : 'No', 'Length:', svgData?.length);
        
        if (svgData) {
          console.log('[useBarcodeGenerationV2] Setting SVG content, first 100 chars:', svgData.substring(0, 100));
          setSvgContent(svgData);
          console.log('[useBarcodeGenerationV2] SVG content set successfully');
        } else {
          console.error('[useBarcodeGenerationV2] No SVG data in response!', result);
          throw new Error('No SVG data in response');
        }
        setMetadata({
          generationTimeMs: result.metadata?.processingTimeMs || result.performance?.processingTimeMs,
          fromCache: result.cached || false,
          engineVersion: '3.0.0',
          complexityLevel: result.metadata?.complexityLevel,
          qualityScore: result.metadata?.qualityScore,
        });
        setServerError(null);
        
      } else {
        // Use old API for non-QR codes
        // Use legacy API for non-QR barcodes
        setIsUsingV2(false);
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const requestUrl = `${backendUrl}/api/v1/barcode`;
        
        const token = localStorage.getItem('authToken');
        
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
  }, []);

  const clearError = useCallback(() => {
    setServerError(null);
    // No limpiar svgContent aquí, solo limpiar errores
  }, []);
  
  const clearContent = useCallback(() => {
    setSvgContent('');
  }, []);

  return {
    svgContent,
    isLoading,
    serverError,
    metadata,
    generateBarcode,
    clearError,
    clearContent,
    isUsingV2,
  };
};