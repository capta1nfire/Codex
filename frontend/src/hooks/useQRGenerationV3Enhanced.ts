/**
 * Hook para generación de QR v3 Enhanced con personalización completa
 * 
 * Este hook consume la API v3 enhanced que retorna datos estructurados
 * con soporte completo para gradientes, efectos, formas personalizadas,
 * logos y marcos.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { QREnhancedData } from '@/components/generator/EnhancedUltrathinkQR';
import { QRV3Customization, QRV3Options } from './useQRGenerationV3';

interface QRV3EnhancedResponse {
  success: boolean;
  data?: QREnhancedData;
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
  };
}

interface UseQRGenerationV3EnhancedReturn {
  enhancedData: QREnhancedData | null;
  isLoading: boolean;
  error: string | null;
  isUsingCache: boolean;
  metadata: QRV3EnhancedResponse['metadata'] | null;
  generateEnhancedQR: (data: string, options?: QRV3Options) => Promise<void>;
  clearData: () => void;
  clearError: () => void;
}

export const useQRGenerationV3Enhanced = (): UseQRGenerationV3EnhancedReturn => {
  const [enhancedData, setEnhancedData] = useState<QREnhancedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [metadata, setMetadata] = useState<QRV3EnhancedResponse['metadata'] | null>(null);
  const { user } = useAuth();

  const generateEnhancedQR = useCallback(async (data: string, options?: QRV3Options) => {
    console.log('[useQRGenerationV3Enhanced] Generating QR with data:', data, 'options:', options);
    // Reset estado
    setError(null);
    setIsLoading(true);
    setEnhancedData(null);
    setMetadata(null);
    setIsUsingCache(false);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available for better rate limits
      const token = user?.token || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      const response = await fetch(`${backendUrl}/api/v3/qr/enhanced`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data,
          options: options || {},
        }),
      });

      const result: QRV3EnhancedResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.metadata?.engine_version?.includes('error') 
          ? 'Failed to generate enhanced QR code'
          : result.metadata?.engine_version || 'Unknown error');
      }

      if (result.data) {
        console.log('[useQRGenerationV3Enhanced] Setting enhanced data:', result.data);
        setEnhancedData(result.data);
        setIsUsingCache(result.metadata.cached);
        setMetadata(result.metadata);
      } else {
        console.warn('[useQRGenerationV3Enhanced] No data in result:', result);
      }
    } catch (err: any) {
      console.error('QR v3 Enhanced generation error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearData = useCallback(() => {
    setEnhancedData(null);
    setError(null);
    setIsUsingCache(false);
    setMetadata(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enhancedData,
    isLoading,
    error,
    isUsingCache,
    metadata,
    generateEnhancedQR,
    clearData,
    clearError,
  };
};

/**
 * Hook combinado que soporta tanto v3 básico como enhanced
 */
export const useQRGenerationV3Combined = () => {
  const basicHook = require('./useQRGenerationV3').useQRGenerationV3();
  const enhancedHook = useQRGenerationV3Enhanced();
  
  // Determinar si usar enhanced basado en las opciones
  const generateQR = useCallback(async (data: string, options?: QRV3Options) => {
    // Si hay customización avanzada, usar enhanced
    const hasAdvancedCustomization = options?.customization && (
      options.customization.gradient ||
      options.customization.effects ||
      options.customization.eye_shape ||
      options.customization.data_pattern ||
      options.customization.logo ||
      options.customization.frame
    );
    
    if (hasAdvancedCustomization) {
      await enhancedHook.generateEnhancedQR(data, options);
    } else {
      await basicHook.generateQR(data, options);
    }
  }, [basicHook, enhancedHook]);
  
  return {
    // Datos básicos
    structuredData: basicHook.structuredData,
    // Datos enhanced
    enhancedData: enhancedHook.enhancedData,
    // Estados comunes
    isLoading: basicHook.isLoading || enhancedHook.isLoading,
    error: basicHook.error || enhancedHook.error,
    isUsingCache: basicHook.isUsingCache || enhancedHook.isUsingCache,
    metadata: basicHook.metadata || enhancedHook.metadata,
    // Funciones
    generateQR,
    clearData: () => {
      basicHook.clearData();
      enhancedHook.clearData();
    },
    clearError: () => {
      basicHook.clearError();
      enhancedHook.clearError();
    },
    // Flags
    isEnhanced: !!enhancedHook.enhancedData,
    isBasic: !!basicHook.structuredData,
  };
};

export default useQRGenerationV3Enhanced;