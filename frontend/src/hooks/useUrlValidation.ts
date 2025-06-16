import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

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

  // Limpiar validación
  const clearValidation = useCallback(() => {
    setMetadata(null);
    setError(null);
    lastValidatedUrl.current = '';
  }, []);

  // Función de validación principal
  const performValidation = useCallback(async (url: string) => {
    // No validar si está deshabilitado o es la misma URL
    if (!enabled || url === lastValidatedUrl.current) {
      return;
    }

    // Validación básica - permitir URLs simples como www.google.com
    const basicPattern = /^([\w-]+\.)+[\w-]+(\/.*)?$/i;
    
    if (!basicPattern.test(url) && !url.includes('://')) {
      setError('Formato de URL inválido');
      setMetadata(null);
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
    lastValidatedUrl.current = url;

    try {
      console.log('Validating URL:', url);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate/check-url`,
        { url },
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000
        }
      );

      const data = response.data as UrlMetadata;
      
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
        return;
      }
      
      console.error('Error validating URL:', err);
      setError('Error al verificar el sitio web');
      setMetadata(null);
    } finally {
      setIsValidating(false);
    }
  }, [enabled]);

  // Crear versión debounced
  const debouncedValidate = useRef(
    debounce(performValidation, debounceMs)
  ).current;

  // Función pública para validar
  const validateUrl = useCallback((url: string) => {
    // Limpiar si está vacío
    if (!url || url.trim().length === 0) {
      clearValidation();
      return;
    }

    // Cancelar validación pendiente
    debouncedValidate.cancel();
    
    // Iniciar nueva validación
    debouncedValidate(url);
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