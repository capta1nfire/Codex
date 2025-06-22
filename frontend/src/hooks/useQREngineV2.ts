/**
 * React hook for QR Engine v2
 * Provides a simple interface for generating QR codes with the new engine
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  getQREngineV2, 
  QRv2GenerateRequest, 
  QRv2GenerateResponse,
  QRv2Options,
  defaultV2Options 
} from '@/lib/qr-engine-v2';

export interface UseQREngineV2Options {
  autoGenerate?: boolean;
  debounceMs?: number;
  onSuccess?: (response: QRv2GenerateResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseQREngineV2Return {
  // State
  loading: boolean;
  error: Error | null;
  result: QRv2GenerateResponse | null;
  
  // Actions
  generate: (data: string, options?: QRv2Options) => Promise<void>;
  validate: (data: string, options?: QRv2Options) => Promise<boolean>;
  reset: () => void;
  
  // Preview URL
  getPreviewUrl: (data: string, options?: Partial<QRv2Options>) => string;
}

/**
 * Hook for using QR Engine v2
 */
export function useQREngineV2(options: UseQREngineV2Options = {}): UseQREngineV2Return {
  const { debounceMs = 300, onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<QRv2GenerateResponse | null>(null);
  
  // Get QR Engine client
  const client = getQREngineV2(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || undefined);
  
  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  /**
   * Generate QR code
   */
  const generate = useCallback(async (data: string, options?: QRv2Options) => {
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // If debouncing is enabled, wait before generating
    if (debounceMs > 0) {
      return new Promise<void>((resolve) => {
        const timer = setTimeout(async () => {
          await performGeneration(data, options);
          resolve();
        }, debounceMs);
        setDebounceTimer(timer);
      });
    }
    
    // Generate immediately
    await performGeneration(data, options);
  }, [debounceTimer, debounceMs]);
  
  /**
   * Perform the actual generation
   */
  const performGeneration = async (data: string, options?: QRv2Options) => {
    if (!data) {
      setError(new Error('Data is required'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const request: QRv2GenerateRequest = {
        data,
        options: { ...defaultV2Options, ...options },
      };
      
      const response = await client.generate(request);
      setResult(response);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate QR code');
      setError(error);
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Validate QR data and options
   */
  const validate = useCallback(async (data: string, options?: QRv2Options): Promise<boolean> => {
    try {
      const request: QRv2GenerateRequest = {
        data,
        options: { ...defaultV2Options, ...options },
      };
      
      const response = await client.validate(request);
      return response.valid;
    } catch (err) {
      console.error('Validation error:', err);
      return false;
    }
  }, [client]);
  
  /**
   * Get preview URL
   */
  const getPreviewUrl = useCallback((data: string, options?: Partial<QRv2Options>): string => {
    return client.getPreviewUrl({
      data,
      eyeShape: options?.eyeShape,
      dataPattern: options?.dataPattern,
      fgColor: options?.foregroundColor,
      bgColor: options?.backgroundColor,
      size: options?.size,
    });
  }, [client]);
  
  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setLoading(false);
    setError(null);
    setResult(null);
  }, [debounceTimer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);
  
  return {
    loading,
    error,
    result,
    generate,
    validate,
    reset,
    getPreviewUrl,
  };
}

/**
 * Hook for real-time QR preview
 */
export function useQRPreview(data: string, options?: Partial<QRv2Options>) {
  const { getPreviewUrl } = useQREngineV2();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  useEffect(() => {
    if (data) {
      setPreviewUrl(getPreviewUrl(data, options));
    } else {
      setPreviewUrl('');
    }
  }, [data, options, getPreviewUrl]);
  
  return previewUrl;
}

/**
 * Hook for batch QR generation
 */
export function useQRBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const client = getQREngineV2(localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || undefined);
  
  const generateBatch = useCallback(async (
    codes: Array<{ data: string; options?: QRv2Options }>,
    batchOptions?: { maxConcurrent?: number; includeMetadata?: boolean }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await client.batch({
        codes: codes.map(code => ({
          data: code.data,
          options: { ...defaultV2Options, ...code.options },
        })),
        options: batchOptions,
      });
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process batch');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [client]);
  
  return {
    loading,
    error,
    generateBatch,
  };
}