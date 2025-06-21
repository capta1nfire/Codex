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
  debounceMs = 1000
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
    // No validar si está deshabilitado o es la misma URL
    if (!enabled || url === lastValidatedUrl.current) {
      return;
    }

    // Clean and validate URL
    const cleanUrl = url.trim();
    console.log(`[performValidation] Starting validation for: ${cleanUrl}`);
    
    // Skip URLs with special characters
    if (cleanUrl.includes('"') || cleanUrl.includes("'") || cleanUrl.includes(';')) {
      return;
    }

    // Don't validate very short URLs (less than 4 characters)
    if (cleanUrl.length < 4) {
      setError(null);
      setMetadata(null);
      return;
    }
    
    // Don't validate single words without dots
    if (!cleanUrl.includes('.') && !cleanUrl.includes('://')) {
      setError(null);
      setMetadata(null);
      return;
    }

    // Validación básica - permitir URLs simples como www.google.com
    const basicPattern = /^([\w-]+\.)+[\w-]+(\/.*)?$/i;
    
    if (!basicPattern.test(cleanUrl) && !cleanUrl.includes('://')) {
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
      // Extract domain to check if it's .edu.co
      let domain = cleanUrl;
      if (cleanUrl.includes('://')) {
        try {
          const urlObj = new URL(cleanUrl);
          domain = urlObj.hostname;
        } catch {
          // If URL parsing fails, use the original
        }
      }
      
      // Use longer timeout for .edu.co domains
      const timeoutMs = domain.endsWith('.edu.co') ? 15000 : 10000;
      
      console.log(`[useUrlValidation] Sending validation request for: ${cleanUrl}`);
      console.log(`[useUrlValidation] Domain: ${domain}`);
      console.log(`[useUrlValidation] Backend URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate/check-url`);
      console.log(`[useUrlValidation] Request timeout: ${timeoutMs}ms`);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate/check-url`,
        { url: cleanUrl },
        {
          signal: abortControllerRef.current.signal,
          timeout: timeoutMs
        }
      );

      console.log(`[useUrlValidation] Response received:`, response.data);
      const data = response.data as UrlMetadata;
      
      // Cache the result
      urlValidationCache.set(cleanUrl, data);
      
      // Solo actualizar si no fue cancelado
      if (!abortControllerRef.current.signal.aborted) {
        setMetadata(data);
        if (!data.exists) {
          setError(data.error || 'El sitio web no pudo ser verificado');
        }
      }
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err.name === 'CanceledError') {
        console.log(`[useUrlValidation] Request was canceled`);
        return;
      }
      
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