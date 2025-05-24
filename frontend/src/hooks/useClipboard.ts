import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  isSupported: boolean;
}

/**
 * Hook personalizado para copiar texto al portapapeles con soporte fallback
 * para navegadores que no soportan la API moderna de clipboard
 */
export const useClipboard = (_options: UseClipboardOptions = {}): UseClipboardReturn => {
  const [copied, setCopied] = useState(false);

  // Verificar si la API de clipboard está disponible
  const isSupported = typeof navigator !== 'undefined' && (
    (navigator.clipboard && window.isSecureContext) || 
    document.queryCommandSupported?.('copy')
  );

  // Función fallback para navegadores antiguos
  const copyToClipboardFallback = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        resolve(successful);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        resolve(false);
      }
    });
  };

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!text) {
      console.warn('No text provided to copy');
      return false;
    }

    try {
      let success = false;

      // Intentar con la API moderna primero
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        // Usar fallback para navegadores que no soportan la API moderna
        success = await copyToClipboardFallback(text);
      }

      if (success) {
        setCopied(true);
        // Reset el estado después de 2 segundos
        setTimeout(() => setCopied(false), 2000);
      }

      return success;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      
      // Intentar con fallback si la API moderna falla
      const fallbackSuccess = await copyToClipboardFallback(text);
      if (fallbackSuccess) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      
      return fallbackSuccess;
    }
  }, []);

  return { copy, copied, isSupported };
}; 