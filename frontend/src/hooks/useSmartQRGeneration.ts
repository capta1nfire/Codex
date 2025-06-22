import { useState, useCallback, useRef } from 'react';
import { SmartQRGenerateResponse } from '@/features/smart-qr/types';
import { smartQRService } from '@/features/smart-qr/services/smartQRService';

/**
 * Dedicated hook for Smart QR generation
 * Completely separated from normal QR generation to prevent conflicts
 */

interface UseSmartQRGenerationReturn {
  isLoading: boolean;
  error: string | null;
  smartQRResult: SmartQRGenerateResponse | null;
  generateSmartQR: (url: string) => Promise<void>;
  clearSmartQR: () => void;
}

export const useSmartQRGeneration = (): UseSmartQRGenerationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartQRResult, setSmartQRResult] = useState<SmartQRGenerateResponse | null>(null);
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const generateSmartQR = useCallback(async (url: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await smartQRService.generate({ url });
      
      // Check if request was aborted
      if (signal.aborted) {
        return;
      }
      
      setSmartQRResult(result);
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      
      console.error('[useSmartQRGeneration] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate Smart QR');
      setSmartQRResult(null);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);
  
  const clearSmartQR = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsLoading(false);
    setError(null);
    setSmartQRResult(null);
  }, []);
  
  return {
    isLoading,
    error,
    smartQRResult,
    generateSmartQR,
    clearSmartQR
  };
};