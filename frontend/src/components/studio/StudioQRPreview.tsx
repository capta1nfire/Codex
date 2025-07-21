/**
 * StudioQRPreview Component
 * 
 * Real QR preview component for Studio that generates actual scannable QR codes
 * using the main QR generation API.
 * 
 * @principle Pilar 1: Seguridad - Uses authenticated API calls
 * @principle Pilar 2: Robustez - Handles errors and loading states
 * @principle Pilar 3: Simplicidad - Simple interface for studio usage
 * @principle Pilar 4: Modularidad - Reusable across Studio components
 * @principle Pilar 5: Valor - Real QR codes, not mocks
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRConfig } from '@/types/studio.types';
import { EnhancedQRV3, QREnhancedData } from '@/components/generator/EnhancedQRV3';
import { Loader2 } from 'lucide-react';

interface StudioQRPreviewProps {
  config: QRConfig;
  size?: number;
  text?: string;
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
}

export function StudioQRPreview({ 
  config, 
  size = 300,
  text = 'https://codex.example.com'
}: StudioQRPreviewProps) {
  const [qrData, setQrData] = useState<QREnhancedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pilar 2: Robustez - Referencias para evitar race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR code using the real API
  const generateQR = useCallback(async () => {
    // Pilar 2: Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    console.log('StudioQRPreview config received:', config);
    console.log('StudioQRPreview use_separated_eye_styles:', config.use_separated_eye_styles);
    console.log('StudioQRPreview eye_shape:', config.eye_shape);
    console.log('StudioQRPreview eye_border_style:', config.eye_border_style);
    console.log('StudioQRPreview eye_center_style:', config.eye_center_style);

    // Pilar 2: Validación defensiva - Asegurar estructura completa
    if (!config || typeof config !== 'object') {
      console.error('StudioQRPreview: Config inválido o vacío');
      setError('Configuración inválida');
      setIsLoading(false);
      return;
    }

    try {
      // Pilar 1: Seguridad - Validar estructura de colores
      const foreground = config.colors?.foreground || '#000000';
      const background = config.colors?.background || '#FFFFFF';
      
      // Validar formato hexadecimal
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(foreground) || !hexColorRegex.test(background)) {
        console.error('StudioQRPreview: Colores con formato inválido', { foreground, background });
        setError('Formato de color inválido');
        setIsLoading(false);
        return;
      }

      // Prepare customization for API - Asegurar valores por defecto
      const customization: any = {
        data_pattern: config.data_pattern || 'square',
        colors: {
          // CRÍTICO: Siempre proporcionar foreground y background válidos
          foreground,
          background,
        },
        // NOTA: error_correction va en options, no en customization
      };
      
      // CRITICAL: Check if using separated eye styles
      // Fix for undefined use_separated_eye_styles causing 400 errors
      const hasSeparatedStyles = config.use_separated_eye_styles === true || 
                                (config.eye_border_style && config.eye_center_style);
      const hasUnifiedStyle = config.eye_shape && !hasSeparatedStyles;
      
      if (hasSeparatedStyles) {
        // Using separated styles - send both border and center
        customization.eye_border_style = config.eye_border_style || 'square';
        customization.eye_center_style = config.eye_center_style || 'square';
      } else if (hasUnifiedStyle) {
        // Using unified style - send only eye_shape
        customization.eye_shape = config.eye_shape;
      } else {
        // Default fallback - use unified style 'rounded'
        customization.eye_shape = 'rounded';
      }

      // Add eye colors if specified
      if (config.colors?.eye_colors) {
        customization.eye_colors = {
          outer: config.colors.eye_colors.outer,
          inner: config.colors.eye_colors.inner,
        };
      }

      // Add gradient if enabled - ensure all required fields
      if (config.gradient?.enabled) {
        customization.gradient = {
          enabled: true,
          gradient_type: config.gradient.gradient_type || 'linear',
          colors: config.gradient.colors || ['#000000', '#666666'],
          angle: config.gradient.angle !== undefined ? config.gradient.angle : 0,
          apply_to_eyes: config.gradient.apply_to_eyes || false,
          apply_to_data: config.gradient.apply_to_data !== false,
          // Ensure stroke_style has all required fields
          stroke_style: config.gradient.stroke_style ? {
            enabled: config.gradient.stroke_style.enabled || false,
            color: config.gradient.stroke_style.color || '#FFFFFF',
            width: config.gradient.stroke_style.width || 0.5,
            opacity: config.gradient.stroke_style.opacity || 0.3,
          } : {
            enabled: false,
            color: '#FFFFFF',
            width: 0.5,
            opacity: 0.3,
          },
        };
      }

      // Add effects if any
      if (config.effects && config.effects.length > 0) {
        customization.effects = config.effects.map(effect => ({
          effect_type: effect.type,
          config: {
            intensity: effect.intensity || 50,
          },
        }));
      }

      // Add frame if enabled
      if (config.frame?.enabled) {
        customization.frame = {
          frame_type: config.frame.style || 'simple',
          text: 'SCAN ME',
          text_position: 'bottom',
          color: config.frame.color || '#000000',
        };
      }

      // Add logo if enabled
      if (config.logo?.enabled && config.logo?.data) {
        customization.logo = {
          data: config.logo.data,
          size_percentage: config.logo.size_percentage || 20,
          padding: config.logo.padding || 5,
          shape: config.logo.shape || 'square',
        };
        console.log('[StudioQRPreview] 🖼️ Logo added to customization:', {
          dataLength: config.logo.data.length,
          dataPreview: config.logo.data.substring(0, 100) + '...',
          isSVG: config.logo.data.includes('image/svg+xml'),
          size: customization.logo.size_percentage,
          shape: customization.logo.shape
        });
      } else {
        console.log('[StudioQRPreview] 🖼️ Logo not included:', {
          enabled: config.logo?.enabled,
          hasData: !!config.logo?.data,
          dataLength: config.logo?.data?.length
        });
      }

      // Make API request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add token if available
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
      
      const requestBody = {
        data: text,
        options: {
          error_correction: config.error_correction || 'M',
          customization,
        },
      };
      
      console.log('StudioQRPreview request body:', JSON.stringify(requestBody, null, 2));
      console.log('StudioQRPreview customization detail:', {
        hasEyeShape: 'eye_shape' in customization,
        hasEyeBorderStyle: 'eye_border_style' in customization,
        hasEyeCenterStyle: 'eye_center_style' in customization,
        eyeShape: customization.eye_shape,
        eyeBorderStyle: customization.eye_border_style,
        eyeCenterStyle: customization.eye_center_style,
        use_separated_eye_styles: config.use_separated_eye_styles
      });
      
      const response = await fetch(`${backendUrl}/api/v3/qr/enhanced`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('StudioQRPreview API error:', errorData);
        throw new Error(errorData.error?.message || errorData.message || 'Failed to generate QR code');
      }

      const result: QRV3EnhancedResponse = await response.json();
      
      if (result.success && result.data) {
        setQrData(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to generate QR code');
      }
    } catch (err) {
      // Pilar 2: No mostrar error si fue cancelado intencionalmente
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('StudioQRPreview: Request cancelado');
        return;
      }
      
      console.error('Error generating QR:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
      // Limpiar referencia si es el controller actual
      if (abortControllerRef.current?.signal.aborted) {
        abortControllerRef.current = null;
      }
    }
  }, [config, text]);

  // Generate QR when config or text changes con debouncing
  useEffect(() => {
    // Pilar 3: Simplicidad - Debounce de 300ms para evitar múltiples llamadas
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      generateQR();
    }, 300);
    
    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [generateQR]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-white rounded-lg"
        style={{ width: size, height: size }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-4"
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-red-600 text-center">Error generando QR</p>
        <p className="text-xs text-red-500 mt-1 text-center">{error}</p>
        <button 
          onClick={generateQR}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // QR display
  if (!qrData) {
    return null;
  }

  return (
    <EnhancedQRV3
      data={qrData}
      totalModules={qrData.metadata.total_modules || 29}
      dataModules={qrData.metadata.data_modules || 21}
      version={qrData.metadata.version || 1}
      errorCorrection={qrData.metadata.error_correction || 'M'}
      size={size}
      transparentBackground={config.colors?.background === 'transparent'}
    />
  );
}