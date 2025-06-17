/**
 * Smart Auto-Generation Hook
 * 
 * Provides intelligent automatic barcode generation with validation,
 * debouncing, and request cancellation.
 * 
 * @module useSmartAutoGeneration
 * @since 2025-01-16
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useBarcodeGenerationV2 } from './useBarcodeGenerationV2';
import { GenerateFormData } from '@/schemas/generate.schema';
import { getValidator, getGenerationDelay } from '@/lib/smartValidation';
// Simple debounce implementation to avoid lodash dependency
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  
  const debounced = (...args: any[]) => {
    lastArgs = args;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...lastArgs!);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  };
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };
  
  return debounced as T & { cancel: () => void };
}

export interface AutoGenerationOptions {
  enabled?: boolean;
  customDelay?: number;
  onValidationError?: (error: string | null) => void;
  onGenerationStart?: () => void;
  onGenerationEnd?: () => void;
  onGenerate?: (formData: GenerateFormData) => void | Promise<void>;
}

export interface SmartAutoGenerationResult {
  validateAndGenerate: (formData: GenerateFormData, qrType?: string, qrFormData?: any) => void;
  isAutoGenerating: boolean;
  validationError: string | null;
  cancelGeneration: () => void;
}

/**
 * Hook for intelligent automatic barcode generation
 * 
 * Features:
 * - Smart validation per barcode type
 * - Optimized debounce delays
 * - Request cancellation
 * - Visual feedback states
 */
export function useSmartAutoGeneration(options: AutoGenerationOptions = {}): SmartAutoGenerationResult {
  const {
    enabled = true,
    customDelay,
    onValidationError,
    onGenerationStart,
    onGenerationEnd,
    onGenerate
  } = options;

  const { generateBarcode } = useBarcodeGenerationV2();
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController>();
  const debouncedFunctionsRef = useRef<Map<string, any>>(new Map());

  /**
   * Cancel any in-flight generation request
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
    setIsAutoGenerating(false);
  }, []);

  /**
   * Core validation and generation logic
   */
  const performValidationAndGeneration = useCallback(async (
    formData: GenerateFormData, 
    qrType?: string,
    qrFormData?: any
  ) => {
    console.log('[DEBUG] performValidationAndGeneration called with:', {
      enabled,
      barcodeType: formData.barcode_type,
      qrType,
      data: formData.data,
      qrFormData
    });
    
    if (!enabled) {
      console.log('[DEBUG] Auto-generation disabled, returning');
      return;
    }

    // Cancel any existing request
    cancelGeneration();

    // Get appropriate validator
    const validator = getValidator(formData.barcode_type, qrType);
    
    if (validator) {
      // Determine what data to validate
      const dataToValidate = formData.barcode_type === 'qrcode' && qrFormData
        ? qrFormData
        : formData.data;

      console.log('[DEBUG] Validating data:', {
        validator: qrType || formData.barcode_type,
        dataToValidate,
        isQRCode: formData.barcode_type === 'qrcode',
        hasQRFormData: !!qrFormData
      });

      // Validate
      const validationResult = validator(dataToValidate);

      console.log('[DEBUG] Validation result:', validationResult);

      if (!validationResult.isValid) {
        const error = validationResult.message || 'Datos incompletos';
        setValidationError(error);
        onValidationError?.(error);
        return;
      }
    }

    // Clear validation error
    setValidationError(null);
    onValidationError?.(null);

    // Start generation
    console.log('[DEBUG] Starting generation with formData:', formData);
    setIsAutoGenerating(true);
    onGenerationStart?.();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      if (onGenerate) {
        console.log('[DEBUG] Calling onGenerate...');
        await onGenerate(formData);
        console.log('[DEBUG] onGenerate completed successfully');
      } else {
        console.log('[DEBUG] Calling generateBarcode...');
        await generateBarcode(formData);
        console.log('[DEBUG] generateBarcode completed successfully');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[DEBUG] Auto-generation error:', error);
      }
    } finally {
      console.log('[DEBUG] Generation finished');
      setIsAutoGenerating(false);
      onGenerationEnd?.();
    }
  }, [enabled, generateBarcode, cancelGeneration, onValidationError, onGenerationStart, onGenerationEnd, onGenerate]);

  /**
   * Get or create debounced function for specific type
   */
  const getDebouncedFunction = useCallback((barcodeType: string, qrType?: string) => {
    const key = `${barcodeType}-${qrType || 'default'}`;
    
    if (!debouncedFunctionsRef.current.has(key)) {
      const delay = customDelay || getGenerationDelay(barcodeType, qrType);
      const debouncedFn = debounce(performValidationAndGeneration, delay, {
        leading: false,
        trailing: true
      });
      debouncedFunctionsRef.current.set(key, debouncedFn);
    }
    
    return debouncedFunctionsRef.current.get(key);
  }, [customDelay, performValidationAndGeneration]);

  /**
   * Main function to validate and generate
   */
  const validateAndGenerate = useCallback((
    formData: GenerateFormData, 
    qrType?: string,
    qrFormData?: any
  ) => {
    console.log('[DEBUG] validateAndGenerate called:', {
      barcodeType: formData.barcode_type,
      qrType,
      data: formData.data
    });
    const debouncedFn = getDebouncedFunction(formData.barcode_type, qrType);
    console.log('[DEBUG] Got debounced function, calling it...');
    debouncedFn(formData, qrType, qrFormData);
  }, [getDebouncedFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending operations
      cancelGeneration();
      
      // Cancel all debounced functions
      debouncedFunctionsRef.current.forEach(fn => {
        if (fn.cancel) fn.cancel();
      });
      debouncedFunctionsRef.current.clear();
    };
  }, [cancelGeneration]);

  return {
    validateAndGenerate,
    isAutoGenerating,
    validationError,
    cancelGeneration
  };
}