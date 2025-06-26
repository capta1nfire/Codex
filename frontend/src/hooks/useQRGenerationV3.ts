/**
 * @deprecated Use useQRGenerationState instead (which uses useQRGenerationV3Enhanced internally)
 * This hook is kept for legacy test pages only
 * 
 * Hook para generación de QR v3 con datos estructurados (ULTRATHINK)
 * 
 * Este hook consume la nueva API v3 que retorna datos estructurados
 * en lugar de SVG strings, permitiendo renderizado seguro sin
 * dangerouslySetInnerHTML.
 */

import { useState, useCallback } from 'react';
import { QREnhancedData } from '@/components/generator/EnhancedUltrathinkQR';

// Tipos para la API v3
export interface QRStructuredData {
  path_data: string;
  total_modules: number;
  data_modules: number;
  version: number;
  error_correction: string;
  metadata: {
    generation_time_ms: number;
    quiet_zone: number;
    content_hash: string;
  };
}

// Tipos para la API v3 Enhanced
export interface QRV3EnhancedResponse {
  success: boolean;
  data?: QREnhancedData;
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
  };
}

export interface QRV3Customization {
  gradient?: {
    enabled: boolean;
    gradient_type: 'linear' | 'radial' | 'conic' | 'diamond' | 'spiral';
    colors: string[];
    angle?: number;
    apply_to_eyes?: boolean;
    apply_to_data?: boolean;
    stroke_style?: {
      enabled: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
  };
  eye_shape?: string;
  data_pattern?: string;
  colors?: {
    foreground: string;
    background: string;
  };
  logo?: {
    data: string;
    size_percentage: number;
    padding: number;
    shape: 'square' | 'circle' | 'rounded_square';
  };
  frame?: {
    frame_type: string;
    text?: string;
    color: string;
    text_position: 'top' | 'bottom' | 'left' | 'right';
  };
  effects?: Array<{
    effect_type: 'shadow' | 'glow' | 'blur' | 'noise' | 'vintage';
    config?: Record<string, any>;
  }>;
}

export interface QRV3Options {
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  customization?: QRV3Customization;
}

interface QRV3Response {
  success: boolean;
  data?: QRStructuredData;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
    total_processing_time_ms?: number;
    backend_version?: string;
  };
}

interface UseQRGenerationV3Return {
  structuredData: QRStructuredData | null;
  isLoading: boolean;
  error: string | null;
  isUsingCache: boolean;
  metadata: QRV3Response['metadata'] | null;
  generateQR: (data: string, options?: QRV3Options) => Promise<void>;
  clearData: () => void;
  clearError: () => void;
}

export const useQRGenerationV3 = (): UseQRGenerationV3Return => {
  const [structuredData, setStructuredData] = useState<QRStructuredData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [metadata, setMetadata] = useState<QRV3Response['metadata'] | null>(null);

  const generateQR = useCallback(async (data: string, options?: QRV3Options) => {
    // Reset estado
    setError(null);
    setIsLoading(true);
    setStructuredData(null);
    setMetadata(null);

    try {
      // v3 is now free - no authentication required
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available for better rate limits
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/v3/qr/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data,
          options: options || {},
        }),
      });

      const result: QRV3Response = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to generate QR code');
      }

      if (result.data) {
        setStructuredData(result.data);
        setIsUsingCache(result.metadata.cached);
        setMetadata(result.metadata);
      }
    } catch (err: any) {
      // Solo loguear si no es un error de autenticación esperado
      if (err.message !== 'Authentication required for v3 API') {
        console.error('QR v3 generation error:', err);
      }
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setStructuredData(null);
    setError(null);
    setIsUsingCache(false);
    setMetadata(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    structuredData,
    isLoading,
    error,
    isUsingCache,
    metadata,
    generateQR,
    clearData,
    clearError,
  };
};

/**
 * Feature flag para habilitar v3 gradualmente
 */
export const isQRV3Enabled = (): boolean => {
  // Puede venir de env var o de un servicio de feature flags
  return process.env.NEXT_PUBLIC_QR_V3_ENABLED === 'true';
};

/**
 * Hook adaptador que detecta si usar v2 o v3
 */
export const useQRGenerationAdaptive = () => {
  const v2Hook = require('./useBarcodeGenerationV2').useBarcodeGenerationV2();
  const v3Hook = useQRGenerationV3();
  const isV3Enabled = isQRV3Enabled();

  if (isV3Enabled) {
    // Adaptar v3 para que sea compatible con la interfaz v2
    return {
      svgContent: '', // v3 no retorna SVG
      structuredData: v3Hook.structuredData,
      isLoading: v3Hook.isLoading,
      serverError: v3Hook.error ? { success: false, error: v3Hook.error } : null,
      metadata: v3Hook.metadata,
      generateBarcode: async (formData: any) => {
        if (formData.barcode_type === 'qrcode' || formData.barcode_type === 'qr') {
          await v3Hook.generateQR(formData.data, {
            error_correction: formData.options?.ecl || 'M',
          });
        } else {
          // Para otros tipos, usar v2
          await v2Hook.generateBarcode(formData);
        }
      },
      clearError: v3Hook.clearData,
      clearContent: v3Hook.clearData,
      isUsingV2: false,
      isUsingV3: true,
    };
  }

  // Si v3 no está habilitado, usar v2
  return {
    ...v2Hook,
    structuredData: null,
    isUsingV3: false,
  };
};