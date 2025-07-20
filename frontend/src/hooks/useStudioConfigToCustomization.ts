/**
 * Hook para convertir configuración de Studio a formato de customización para el backend
 * 
 * @principle Pilar 1: Seguridad - Validación de tipos y valores
 * @principle Pilar 2: Robustez - Manejo de casos edge
 * @principle Pilar 3: Simplicidad - Conversión clara y directa
 * @principle Pilar 4: Modularidad - Hook reutilizable
 * @principle Pilar 5: Valor - Mapeo correcto para QR funcional
 */

import { useMemo } from 'react';
import { QRConfig } from '@/types/studio.types';
import { QRV3Customization } from '@/types/generator.types';

export function useStudioConfigToCustomization(config: QRConfig): QRV3Customization {
  return useMemo(() => {
    const customization: QRV3Customization = {
      // Eye styles
      ...(config.use_separated_eye_styles ? {
        eye_border_style: config.eye_border_style || 'circle',
        eye_center_style: config.eye_center_style || 'circle',
      } : config.eye_shape ? {
        eye_shape: config.eye_shape,
      } : {}),
      
      // Data pattern
      data_pattern: config.data_pattern || 'dots',
      
      // Basic colors
      colors: {
        foreground: config.colors?.foreground || '#000000',
        background: config.colors?.background || '#FFFFFF',
      },
      
      // Eye color modes
      eye_color_mode: config.eye_center_color_mode || 'inherit',
      eye_border_color_mode: config.eye_border_color_mode || 'inherit',
    };

    // Handle eye border colors
    if (config.eye_border_color_mode === 'custom') {
      if (config.eye_border_gradient?.enabled) {
        customization.eye_border_gradient = {
          enabled: true,
          gradient_type: config.eye_border_gradient.gradient_type,
          colors: config.eye_border_gradient.colors,
          angle: config.eye_border_gradient.angle,
        };
      } else if (config.eye_border_colors?.primary) {
        customization.eye_border_color_solid = config.eye_border_colors.primary;
      }
    }
    
    // Handle eye border width and opacity
    if (config.eye_border_width !== undefined) {
      customization.eye_border_width = config.eye_border_width;
    }
    if (config.eye_border_opacity !== undefined) {
      customization.eye_border_opacity = config.eye_border_opacity;
    }

    // Handle eye center colors
    if (config.eye_center_color_mode === 'custom') {
      if (config.eye_center_gradient?.enabled) {
        customization.eye_center_gradient = {
          enabled: true,
          gradient_type: config.eye_center_gradient.gradient_type,
          colors: config.eye_center_gradient.colors,
          angle: config.eye_center_gradient.angle,
        };
      } else if (config.eye_center_colors?.primary) {
        customization.eye_color_solid = config.eye_center_colors.primary;
      }
    }

    // Main gradient
    if (config.gradient?.enabled) {
      customization.gradient = {
        enabled: true,
        gradient_type: config.gradient.gradient_type,
        colors: config.gradient.colors,
        apply_to_data: config.gradient.apply_to_data ?? true,
        apply_to_eyes: config.gradient.apply_to_eyes ?? true,
        per_module: config.gradient.per_module,
        stroke_style: config.gradient.stroke_style,
      };
    }

    // Effects
    if (config.effects && config.effects.length > 0) {
      customization.effects = config.effects.map(effect => ({
        effect_type: effect.type,
        config: {},
      }));
    }

    // Logo - check both possible fields
    const logoData = (config.logo as any)?.data || (config.logo as any)?.image;
    if (config.logo?.enabled && logoData) {
      customization.logo = {
        data: logoData,
        size_percentage: config.logo.size_percentage || 20,
        shape: config.logo.shape || 'square',
        padding: config.logo.padding || 5,
      };
    }

    // Frame
    if (config.frame?.enabled) {
      customization.frame = {
        frame_type: config.frame.style,
        color: config.frame.color,
      };
    }

    return customization;
  }, [config]);
}

export default useStudioConfigToCustomization;