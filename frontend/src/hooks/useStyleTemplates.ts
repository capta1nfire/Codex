/**
 * Style Templates Hook
 * 
 * Manages style template selection, application, and analytics.
 */

import { useState, useCallback } from 'react';
import { StyleTemplate } from '@/types/styleTemplates';
import { QRV3Customization } from './useQRGenerationV3';

interface UseStyleTemplatesReturn {
  selectedTemplate: StyleTemplate | null;
  selectTemplate: (template: StyleTemplate) => void;
  applyTemplate: (template: StyleTemplate) => QRV3Customization;
  clearTemplate: () => void;
  trackTemplateUsage: (templateId: string) => void;
}

export function useStyleTemplates(): UseStyleTemplatesReturn {
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);

  const selectTemplate = useCallback((template: StyleTemplate) => {
    setSelectedTemplate(template);
    trackTemplateUsage(template.id);
  }, []);

  const applyTemplate = useCallback((template: StyleTemplate): QRV3Customization => {
    // Extract QR customization from template config
    const { frame, ...qrConfig } = template.config;
    
    // Ensure all required fields are present
    const customization: QRV3Customization = {
      colors: qrConfig.colors || {
        foreground: '#000000',
        background: '#FFFFFF'
      },
      eye_shape: qrConfig.eye_shape,
      eye_border_style: qrConfig.eye_border_style,
      eye_center_style: qrConfig.eye_center_style,
      data_pattern: qrConfig.data_pattern,
      gradient: qrConfig.gradient,
      effects: qrConfig.effects || [],
      // Include frame if present in template
      frame: frame
    };

    return customization;
  }, []);

  const clearTemplate = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const trackTemplateUsage = useCallback((templateId: string) => {
    // In a real app, this would send analytics to the backend
    console.log('Template used:', templateId);
    
    // Simulated analytics call
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'template_applied', {
        template_id: templateId,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  return {
    selectedTemplate,
    selectTemplate,
    applyTemplate,
    clearTemplate,
    trackTemplateUsage
  };
}