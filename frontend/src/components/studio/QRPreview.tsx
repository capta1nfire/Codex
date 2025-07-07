/**
 * QRPreview Component for Studio
 * 
 * Provides a simplified preview of QR codes using mock data.
 * This component generates the proper data structure for EnhancedQRV3
 * from a QRConfig object.
 * 
 * @principle Pilar 1: Seguridad - No API calls, solo mock data
 * @principle Pilar 2: Robustez - Manejo seguro de props opcionales
 * @principle Pilar 3: Simplicidad - Interfaz simple para preview
 * @principle Pilar 4: Modularidad - Reutilizable en todo Studio
 * @principle Pilar 5: Valor - Preview instantáneo sin servidor
 */

'use client';

import { useMemo } from 'react';
import { EnhancedQRV3, QREnhancedData } from '@/components/generator/EnhancedQRV3';
import { QRConfig } from '@/types/studio.types';

interface QRPreviewProps {
  config: QRConfig;
  size?: number;
  text?: string;
}

export function QRPreview({ 
  config, 
  size = 300,
  text = 'https://codex.example.com'
}: QRPreviewProps) {
  // Generate mock QR data based on config
  const qrData = useMemo((): QREnhancedData => {
    // Mock QR pattern - creates a simple pattern for preview
    const mockDataPath = [
      'M10,10 L10,15 L15,15 L15,10 Z',
      'M20,10 L20,15 L25,15 L25,10 Z', 
      'M10,20 L10,25 L15,25 L15,20 Z',
      'M15,15 L15,20 L20,20 L20,15 Z',
      'M5,5 L5,8 L8,8 L8,5 Z',
      'M21,5 L21,8 L24,8 L24,5 Z',
      'M5,21 L5,24 L8,24 L8,21 Z'
    ].join(' ');
    
    // Mock eye patterns based on eye_shape
    const eyeShapes = {
      square: {
        topLeft: 'M4,4 L4,11 L11,11 L11,4 Z M5,5 L10,5 L10,10 L5,10 Z',
        topRight: 'M18,4 L18,11 L25,11 L25,4 Z M19,5 L24,5 L24,10 L19,10 Z',
        bottomLeft: 'M4,18 L4,25 L11,25 L11,18 Z M5,19 L10,19 L10,24 L5,24 Z'
      },
      circle: {
        topLeft: 'M7.5,4 A3.5,3.5 0 1,1 7.5,11 A3.5,3.5 0 1,1 7.5,4 M7.5,5 A2.5,2.5 0 1,0 7.5,10 A2.5,2.5 0 1,0 7.5,5',
        topRight: 'M21.5,4 A3.5,3.5 0 1,1 21.5,11 A3.5,3.5 0 1,1 21.5,4 M21.5,5 A2.5,2.5 0 1,0 21.5,10 A2.5,2.5 0 1,0 21.5,5',
        bottomLeft: 'M7.5,18 A3.5,3.5 0 1,1 7.5,25 A3.5,3.5 0 1,1 7.5,18 M7.5,19 A2.5,2.5 0 1,0 7.5,24 A2.5,2.5 0 1,0 7.5,19'
      },
      rounded_square: {
        topLeft: 'M5,4 L10,4 Q11,4 11,5 L11,10 Q11,11 10,11 L5,11 Q4,11 4,10 L4,5 Q4,4 5,4 M6,5 L9,5 Q10,5 10,6 L10,9 Q10,10 9,10 L6,10 Q5,10 5,9 L5,6 Q5,5 6,5',
        topRight: 'M19,4 L24,4 Q25,4 25,5 L25,10 Q25,11 24,11 L19,11 Q18,11 18,10 L18,5 Q18,4 19,4 M20,5 L23,5 Q24,5 24,6 L24,9 Q24,10 23,10 L20,10 Q19,10 19,9 L19,6 Q19,5 20,5',
        bottomLeft: 'M5,18 L10,18 Q11,18 11,19 L11,24 Q11,25 10,25 L5,25 Q4,25 4,24 L4,19 Q4,18 5,18 M6,19 L9,19 Q10,19 10,20 L10,23 Q10,24 9,24 L6,24 Q5,24 5,23 L5,20 Q5,19 6,19'
      }
    };
    
    const selectedEyeShape = eyeShapes[config.eye_shape || 'square'] || eyeShapes.square;
    
    // Determine colors
    const foregroundColor = config.gradient?.enabled && config.gradient?.colors?.length >= 2
      ? 'url(#qr-gradient)'
      : (config.colors?.foreground || '#000000');
    
    const backgroundColor = config.colors?.background || '#FFFFFF';
    
    const data: QREnhancedData = {
      paths: {
        data: mockDataPath,
        eyes: [
          { type: 'top-left', path: selectedEyeShape.topLeft, shape: config.eye_shape || 'square' },
          { type: 'top-right', path: selectedEyeShape.topRight, shape: config.eye_shape || 'square' },
          { type: 'bottom-left', path: selectedEyeShape.bottomLeft, shape: config.eye_shape || 'square' }
        ]
      },
      styles: {
        data: {
          fill: foregroundColor,
          shape: config.data_pattern
        },
        eyes: {
          fill: config.gradient?.apply_to_eyes ? foregroundColor : (config.colors?.foreground || '#000000'),
          shape: config.eye_shape
        },
        background: {
          fill: backgroundColor
        }
      },
      metadata: {
        generation_time_ms: 1,
        quiet_zone: 4,
        content_hash: 'preview',
        total_modules: 29,
        data_modules: 21,
        version: 1,
        error_correction: config.error_correction || 'M'
      }
    };
    
    // Add gradient definition if enabled
    if (config.gradient?.enabled && config.gradient?.colors?.length >= 2) {
      data.definitions = [{
        type: 'gradient',
        id: 'qr-gradient',
        gradient_type: config.gradient.gradient_type || 'linear',
        colors: config.gradient.colors,
        angle: config.gradient.angle || 0
      }];
    }
    
    return data;
  }, [config]);
  
  return (
    <EnhancedQRV3
      data={qrData}
      totalModules={29}
      dataModules={21}
      version={1}
      errorCorrection={config.error_correction || 'M'}
      size={size}
      transparentBackground={config.colors?.background === 'transparent'}
    />
  );
}