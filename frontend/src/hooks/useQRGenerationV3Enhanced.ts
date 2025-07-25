/**
 * Hook para generación de QR v3 Enhanced con personalización completa
 * 
 * Este hook consume la API v3 enhanced que retorna datos estructurados
 * con soporte completo para gradientes, efectos, formas personalizadas,
 * logos y marcos.
 */

import { useState, useCallback } from 'react';
import { QREnhancedData } from '@/components/generator/EnhancedQRV3';
import { QRV3Options } from './useQRGenerationV3';

interface ScannabilityAnalysis {
  score: number;
  issues: Array<{
    type: 'contrast' | 'logo_size' | 'pattern_complexity' | 'eye_visibility' | 'gradient_complexity';
    severity: 'warning' | 'error';
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
  suggestedECC?: 'L' | 'M' | 'Q' | 'H';
  contrastRatio: number;
}

interface QRV3EnhancedResponse {
  success: boolean;
  data?: QREnhancedData;
  error?: {
    message: string;
  };
  metadata: {
    engine_version: string;
    cached: boolean;
    processing_time_ms: number;
  };
  scannability?: ScannabilityAnalysis;
}

interface UseQRGenerationV3EnhancedReturn {
  enhancedData: QREnhancedData | null;
  isLoading: boolean;
  error: string | null;
  isUsingCache: boolean;
  metadata: QRV3EnhancedResponse['metadata'] | null;
  scannability: ScannabilityAnalysis | null;
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
  const [scannability, setScannability] = useState<ScannabilityAnalysis | null>(null);

  const generateEnhancedQR = useCallback(async (data: string, options?: QRV3Options) => {
    console.log('[useQRGenerationV3Enhanced] Generating QR with data:', data, 'options:', options);
    // Reset estado
    setError(null);
    setIsLoading(true);
    setEnhancedData(null);
    setMetadata(null);
    setIsUsingCache(false);
    setScannability(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available for better rate limits
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      
      // Prepare request body
      const requestBody = {
        data,
        options: options || {},
      };
      
      // Add logo_size_ratio if logo is present
      if (options?.customization?.logo) {
        // Calculate logo_size_ratio from size_percentage if present
        const logoSizePercentage = options.customization.logo.size_percentage || 20;
        const logoSizeRatio = logoSizePercentage / 100; // Convert percentage to ratio
        
        // Ensure customization object exists and add logo_size_ratio
        requestBody.options.customization = {
          ...requestBody.options.customization,
          logo_size_ratio: logoSizeRatio
        };
        
        console.log('[useQRGenerationV3Enhanced] Added logo_size_ratio:', logoSizeRatio);
      }
      
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[QR Enhanced] Generating QR:', { data: data.substring(0, 50), hasCustomization: !!options?.customization });
        console.log('[QR Enhanced] Request body:', JSON.stringify(requestBody, null, 2));
        if (options?.customization?.gradient) {
          console.log('[QR Enhanced] 🎯 GRADIENT CONFIG:', {
            enabled: options.customization.gradient.enabled,
            type: options.customization.gradient.gradient_type,
            angle: options.customization.gradient.angle,
            colors: options.customization.gradient.colors,
            fullGradient: options.customization.gradient
          });
        }
      }
      
      const response = await fetch(`${backendUrl}/api/v3/qr/enhanced`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      const result: QRV3EnhancedResponse = await response.json();
      
      // Response debug only in development
      if (process.env.NODE_ENV === 'development' && (!response.ok || !result.success)) {
        console.log('[QR Enhanced] Response error:', { status: response.status, error: result.error });
      }

      if (!response.ok || !result.success) {
        if (response.status === 422 && result.error) {
          throw new Error(result.error.message || 'Las opciones de personalización no son válidas');
        }
        throw new Error(result.error?.message || 
          result.metadata?.engine_version?.includes('error') 
            ? 'Error al generar el código QR personalizado'
            : result.metadata?.engine_version || 'Error desconocido');
      }

      if (result.data) {
        setEnhancedData(result.data);
        setIsUsingCache(result.metadata.cached);
        setMetadata(result.metadata);
        
        // Debug logging for definitions
        if (process.env.NODE_ENV === 'development') {
          console.log('[QR Enhanced] Received enhanced data:', {
            hasDefinitions: !!result.data.definitions,
            definitionsCount: result.data.definitions?.length || 0,
            definitions: result.data.definitions
          });
          
        }
        
        // Set scannability data if available
        if (result.scannability) {
          setScannability(result.scannability);
        }
      }
    } catch (err: any) {
      console.error('QR v3 Enhanced generation error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setEnhancedData(null);
    setError(null);
    setIsUsingCache(false);
    setMetadata(null);
    setScannability(null);
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
    scannability,
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