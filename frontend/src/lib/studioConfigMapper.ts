/**
 * Studio Config Mapper
 * 
 * This utility provides a function to safely map the QR Studio configuration object (QRConfig)
 * to the form options object used by react-hook-form (GenerateFormData['options']).
 * 
 * It handles the structural differences between the two types, ensuring type safety
 * and preventing runtime errors.
 */

import { QRConfig } from '@/types/studio.types';
import { GenerateFormData } from '@/schemas/generate.schema';

type FormOptions = NonNullable<GenerateFormData['options']>;

export function mapStudioConfigToFormOptions(config: QRConfig): FormOptions {
  console.log('[studioConfigMapper] 🎯 INPUT config:', config);
  console.log('[studioConfigMapper] 🎯 GRADIENT config:', config?.gradient);
  
  const formOptions: FormOptions = {};

  // Early return if config is null or undefined
  if (!config) {
    console.log('[studioConfigMapper] ❌ Config is null/undefined, returning empty options');
    return formOptions;
  }

  // Map colors
  if (config.colors) {
    formOptions.fgcolor = config.colors.foreground;
    formOptions.bgcolor = config.colors.background;
  }

  // Map gradient
  if (config.gradient) {
    console.log('[studioConfigMapper] 📐 Mapping gradient:', {
      enabled: config.gradient.enabled,
      type: config.gradient.gradient_type,
      angle: config.gradient.angle,
      colors: config.gradient.colors
    });
    
    formOptions.gradient_enabled = config.gradient.enabled;
    if (config.gradient.gradient_type === 'linear' || config.gradient.gradient_type === 'radial' || 
        config.gradient.gradient_type === 'conic' || config.gradient.gradient_type === 'diamond' || 
        config.gradient.gradient_type === 'spiral') {
       formOptions.gradient_type = config.gradient.gradient_type;
    }
    // Safe access to gradient colors array
    if (config.gradient.colors && config.gradient.colors.length >= 2) {
      formOptions.gradient_color1 = config.gradient.colors[0];
      formOptions.gradient_color2 = config.gradient.colors[1];
    }
    formOptions.gradient_angle = config.gradient.angle;
    console.log('[studioConfigMapper] 📐 Setting gradient_angle to:', config.gradient.angle);
    
    formOptions.gradient_apply_to_eyes = config.gradient.apply_to_eyes;
    formOptions.gradient_per_module = config.gradient.per_module;

    if (config.gradient.stroke_style) {
      formOptions.gradient_borders = config.gradient.stroke_style.enabled;
      formOptions.gradient_border_color = config.gradient.stroke_style.color;
      formOptions.gradient_border_width = config.gradient.stroke_style.width;
      formOptions.gradient_border_opacity = config.gradient.stroke_style.opacity;
    }
  }

  // Map eye styles
  formOptions.use_separated_eye_styles = config.use_separated_eye_styles;
  if(config.eye_border_style) {
      formOptions.eye_border_style = config.eye_border_style as FormOptions['eye_border_style'];
  }
  if(config.eye_center_style) {
      formOptions.eye_center_style = config.eye_center_style as FormOptions['eye_center_style'];
  }


  // Map data pattern
  if(config.data_pattern) {
    formOptions.data_pattern = config.data_pattern as FormOptions['data_pattern'];
  }

  // Map frame - all fields
  if (config.frame) {
    formOptions.frame_enabled = config.frame.enabled;
    formOptions.frame_style = (config.frame as any).style;
    formOptions.frame_text = (config.frame as any).text;
    formOptions.frame_text_position = (config.frame as any).text_position;
    formOptions.frame_color = config.frame.color;
    formOptions.frame_background_color = (config.frame as any).background_color;
    formOptions.frame_text_size = (config.frame as any).text_size;
    formOptions.frame_text_font = (config.frame as any).text_font;
    formOptions.frame_padding = (config.frame as any).padding;
    formOptions.frame_border_width = (config.frame as any).border_width;
    formOptions.frame_corner_radius = (config.frame as any).corner_radius;
  }
  
  // Map error correction
  formOptions.ecl = config.error_correction;

  // Map transparent background
  formOptions.transparent_background = config.transparent_background;

  // Map logo configuration
  if (config.logo && config.logo.enabled && config.logo.data) {
    console.log('[studioConfigMapper] 🖼️ Mapping logo:', {
      enabled: config.logo.enabled,
      hasData: !!config.logo.data,
      dataLength: config.logo.data?.length,
      size: config.logo.size_percentage,
      shape: config.logo.shape
    });
    
    formOptions.logo_enabled = true;
    formOptions.logo_data = config.logo.data;
    formOptions.logo_size = config.logo.size_percentage || 20;
    formOptions.logo_shape = config.logo.shape || 'square';
    formOptions.logo_padding = config.logo.padding || 5;
  }

  // Map effects
  if (config.effects && Array.isArray(config.effects)) {
    formOptions.effects = config.effects.map(effect => effect.type);
  }

  console.log('[studioConfigMapper] 🎯 FINAL formOptions:', formOptions);
  console.log('[studioConfigMapper] 📐 FINAL gradient_angle:', formOptions.gradient_angle);
  console.log('[studioConfigMapper] 🖼️ FINAL logo:', {
    enabled: formOptions.logo_enabled,
    hasData: !!formOptions.logo_data,
    dataLength: formOptions.logo_data?.length
  });
  
  return formOptions;
} 