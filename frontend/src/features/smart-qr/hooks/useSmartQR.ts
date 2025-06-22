/**
 * useSmartQR Hook
 * Main hook for Smart QR functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { smartQRService } from '../services/smartQRService';
import {
  SmartQRState,
  SmartQRAnalysisState,
  SmartQRAnalysisStep,
  SmartQRConfig,
  SmartQRLimitStatus
} from '../types';

interface UseSmartQROptions {
  onComplete?: (config: SmartQRConfig) => void;
  onError?: (error: string) => void;
  autoCheckLimit?: boolean;
}

const ANALYSIS_STEPS: Array<{
  step: SmartQRAnalysisStep;
  message: string;
  duration: number;
  progress: number;
}> = [
  { step: 'analyzing-url', message: 'Analizando sitio web...', duration: 400, progress: 20 },
  { step: 'detecting-domain', message: 'Detectando dominio...', duration: 300, progress: 40 },
  { step: 'selecting-template', message: 'Seleccionando plantilla inteligente...', duration: 500, progress: 70 },
  { step: 'applying-style', message: 'Aplicando estilo personalizado...', duration: 300, progress: 90 },
  { step: 'complete', message: '¡Listo!', duration: 200, progress: 100 }
];

export const useSmartQR = (options: UseSmartQROptions = {}) => {
  const { user, token } = useAuth();
  const [state, setState] = useState<SmartQRState>({
    isAnalyzing: false,
    template: null,
    config: null,
    remaining: 3,
    error: null
  });
  
  const [analysisState, setAnalysisState] = useState<SmartQRAnalysisState>({
    currentStep: 'idle',
    progress: 0,
    message: ''
  });

  const [limitStatus, setLimitStatus] = useState<SmartQRLimitStatus | null>(null);
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Check limit on mount if enabled
  useEffect(() => {
    if (options.autoCheckLimit && user) {
      checkLimit();
    }
  }, [user, options.autoCheckLimit]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  /**
   * Check usage limit
   */
  const checkLimit = useCallback(async () => {
    if (!user) return;

    try {
      const status = await smartQRService.checkLimit(token || undefined);
      setLimitStatus(status);
      setState(prev => ({ ...prev, remaining: status.remaining }));
    } catch (error) {
      console.error('Failed to check limit:', error);
    }
  }, [user, token]);

  /**
   * Animate through analysis steps
   */
  const animateAnalysis = useCallback(async () => {
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      const step = ANALYSIS_STEPS[i];
      
      setAnalysisState({
        currentStep: step.step,
        progress: step.progress,
        message: step.message
      });

      await new Promise(resolve => {
        animationRef.current = setTimeout(resolve, step.duration);
      });
    }
  }, []);

  /**
   * Generate Smart QR
   */
  const generateSmartQR = useCallback(async (url: string) => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'Debes iniciar sesión para usar QR Inteligentes'
      }));
      options.onError?.('Authentication required');
      return null;
    }

    // Reset state
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      template: null,
      config: null
    }));

    setAnalysisState({
      currentStep: 'analyzing-url',
      progress: 0,
      message: 'Iniciando análisis...'
    });

    try {
      // Start animation
      const animationPromise = animateAnalysis();

      // Make API call with token from context
      const response = await smartQRService.generate({
        url,
        options: {
          skipAnalysisDelay: false // Let backend handle delay
        }
      }, token || undefined);

      // Wait for animation to complete
      await animationPromise;

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate Smart QR');
      }

      const { data } = response;
      
      // Update state with results
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        template: data?.templateId ? {
          id: data.templateId,
          name: data.templateName || 'Custom',
          tags: [],
          applied: true
        } : null,
        config: data?.configuration || null,
        remaining: data?.remaining || 0,
        lastGeneratedUrl: url
      }));

      // Call success callback
      if (data?.configuration) {
        options.onComplete?.(data.configuration);
      }

      return data?.configuration || null;

    } catch (error: any) {
      console.error('[useSmartQR] Error:', error);
      
      // Clear animation timeout
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error al generar QR inteligente';
      
      // Check if it's an authentication error
      const isAuthError = error.response?.status === 401 || 
                         error.response?.data?.error?.code === 'UNAUTHORIZED';
      
      const finalMessage = isAuthError 
        ? 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
        : errorMessage;
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: finalMessage
      }));

      setAnalysisState({
        currentStep: 'idle',
        progress: 0,
        message: ''
      });

      options.onError?.(finalMessage);
      return null;
    }
  }, [user, token, animateAnalysis, options]);

  /**
   * Get available templates for a URL
   */
  const getAvailableTemplates = useCallback(async (url: string) => {
    if (!user) return { templates: [] };

    try {
      return await smartQRService.getTemplatesForUrl(url);
    } catch (error) {
      console.error('Failed to get templates:', error);
      return { templates: [] };
    }
  }, [user]);

  /**
   * Preview a template
   */
  const previewTemplate = useCallback(async (templateId: string, url: string) => {
    if (!user) return null;

    try {
      return await smartQRService.previewTemplate(templateId, url);
    } catch (error) {
      console.error('Failed to preview template:', error);
      return null;
    }
  }, [user]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      template: null,
      config: null,
      remaining: limitStatus?.remaining || 3,
      error: null
    });
    setAnalysisState({
      currentStep: 'idle',
      progress: 0,
      message: ''
    });
  }, [limitStatus]);

  return {
    // State
    ...state,
    analysisState,
    limitStatus,
    
    // Computed
    canGenerate: !!user && state.remaining > 0 && !state.isAnalyzing,
    isAuthenticated: !!user,
    
    // Actions
    generateSmartQR,
    getAvailableTemplates,
    previewTemplate,
    checkLimit,
    reset
  };
};