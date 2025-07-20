import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { urlValidationCache } from '@/lib/validationCache';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  return debounced as T & { cancel: () => void };
}

interface UrlMetadata {
  exists: boolean;
  title?: string;
  description?: string;
  favicon?: string;
  statusCode?: number;
  error?: string;
}

interface UseUrlValidationOptions {
  enabled?: boolean;
  debounceMs?: number;
  onValidationComplete?: (exists: boolean | null, error: any, url: string) => void;
}

interface UseUrlValidationReturn {
  isValidating: boolean;
  metadata: UrlMetadata | null;
  error: string | null;
  validateUrl: (url: string) => void;
  clearValidation: () => void;
}

/**
 * Hook para validar URLs y obtener metadata
 */
export function useUrlValidation({
  enabled = true,
  debounceMs = 600, // Balanced debouncing for responsive UX
  onValidationComplete
}: UseUrlValidationOptions = {}): UseUrlValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [metadata, setMetadata] = useState<UrlMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cancelación de requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidatedUrl = useRef<string>('');
  
  // Create debounced validate ref to avoid circular dependency
  const debouncedValidateRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Limpiar validación
  const clearValidation = useCallback(() => {
    setMetadata(null);
    setError(null);
    lastValidatedUrl.current = '';
    // Also cancel any pending validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debouncedValidateRef.current) {
      debouncedValidateRef.current.cancel();
    }
  }, []);

  // Función de validación principal
  const performValidation = useCallback(async (url: string) => {
    // No validar si está deshabilitado
    if (!enabled) {
      return;
    }
    
    // Clean and normalize URL FIRST
    let cleanUrl = url.trim();
    
    // Normalize URL to add protocol if missing
    if (!cleanUrl.includes('://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    // No validar si es la misma URL normalizada
    if (cleanUrl === lastValidatedUrl.current) {
      return;
    }
    
    console.log(`[performValidation] Starting validation for: ${cleanUrl}`);
    
    // Skip URLs with special characters
    if (cleanUrl.includes('"') || cleanUrl.includes("'") || cleanUrl.includes(';')) {
      return;
    }

    // Don't validate very short URLs (less than 4 characters for domain)
    const urlForValidation = url.trim();
    if (urlForValidation.length < 4) {
      setError(null);
      setMetadata(null);
      return;
    }
    
    // Don't validate single words without dots
    if (!urlForValidation.includes('.')) {
      setError(null);
      setMetadata(null);
      return;
    }

    // Validación básica - usar URL normalizada
    const fullUrlPattern = /^https?:\/\/([\w-]+\.)+[\w-]+(\/.*)?$/i;
    
    if (!fullUrlPattern.test(cleanUrl)) {
      setError('Formato de URL inválido');
      setMetadata(null);
      return;
    }

    // Check cache first
    const cachedResult = urlValidationCache.get(cleanUrl);
    if (cachedResult) {
      setMetadata(cachedResult);
      setError(cachedResult.exists ? null : cachedResult.error || 'El sitio web no pudo ser verificado');
      lastValidatedUrl.current = cleanUrl;
      return;
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo controller
    abortControllerRef.current = new AbortController();
    
    setIsValidating(true);
    setError(null);
    lastValidatedUrl.current = cleanUrl;

    try {
      // Use optimized timeout for better UX
      const timeoutMs = 6000; // 6 seconds total (backend uses 3-5s)
      
      console.log(`[useUrlValidation] Sending validation request for: ${cleanUrl}`);
      console.log(`[useUrlValidation] Backend URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate`);
      console.log(`[useUrlValidation] Request timeout: ${timeoutMs}ms`);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate`,
        { url: cleanUrl },
        {
          signal: abortControllerRef.current.signal,
          timeout: timeoutMs
        }
      );

      console.log(`[useUrlValidation] Response received:`, response.data);
      // Validator returns data in response.data.data
      const data = (response.data.success && response.data.data ? response.data.data : response.data) as UrlMetadata;
      
      // Cache the result
      urlValidationCache.set(cleanUrl, data);
      
      // Solo actualizar si no fue cancelado
      if (!abortControllerRef.current.signal.aborted) {
        setMetadata(data);
        if (!data.exists) {
          setError(data.error || 'El sitio web no pudo ser verificado');
        }
        onValidationComplete?.(data.exists, null, cleanUrl);
      }
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err.name === 'CanceledError') {
        console.log(`[useUrlValidation] Request was canceled`);
        return;
      }
      
      onValidationComplete?.(null, err, cleanUrl);

      console.error('[useUrlValidation] Error validating URL:', err);
      console.error('[useUrlValidation] Error details:', {
        code: err.code,
        message: err.message,
        response: err.response?.data,
        isTimeout: err.code === 'ECONNABORTED'
      });
      
      // Special handling for timeout errors
      if (err.code === 'ECONNABORTED') {
        setError('La validación tomó demasiado tiempo. Por favor intenta de nuevo.');
      } else {
        setError('Error al verificar el sitio web');
      }
      setMetadata(null);
    } finally {
      console.log(`[useUrlValidation] Validation finished, setting isValidating to false`);
      setIsValidating(false);
    }
  }, [enabled]);

  // Crear versión debounced
  const debouncedValidate = useRef(
    debounce(performValidation, debounceMs)
  ).current;
  
  // Store ref for cleanup
  debouncedValidateRef.current = debouncedValidate;

  // Función pública para validar
  const validateUrl = useCallback((url: string) => {
    // Limpiar si está vacío
    if (!url || url.trim().length === 0) {
      clearValidation();
      return;
    }

    // Don't validate URLs with special characters that shouldn't be processed
    const cleanUrl = url.trim();
    if (cleanUrl.includes('"') || cleanUrl.includes("'") || cleanUrl.includes(';')) {
      setError('URL contiene caracteres inválidos');
      setMetadata(null);
      return;
    }

    // Cancelar validación pendiente
    debouncedValidate.cancel();
    
    // Iniciar nueva validación
    debouncedValidate(cleanUrl);
  }, [debouncedValidate, clearValidation]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedValidate]);

  return {
    isValidating,
    metadata,
    error,
    validateUrl,
    clearValidation
  };
}