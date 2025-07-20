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
  const formOptions: FormOptions = {};

  // Early return if config is null or undefined
  if (!config) {
    return formOptions;
  }

  // Map colors
  if (config.colors) {
    formOptions.fgcolor = config.colors.foreground;
    formOptions.bgcolor = config.colors.background;
  }

  // Map gradient
  if (config.gradient) {
    formOptions.gradient_enabled = config.gradient.enabled;
    if (config.gradient.gradient_type === 'linear' || config.gradient.gradient_type === 'radial') {
       formOptions.gradient_type = config.gradient.gradient_type;
    }
    // Safe access to gradient colors array
    if (config.gradient.colors && config.gradient.colors.length >= 2) {
      formOptions.gradient_color1 = config.gradient.colors[0];
      formOptions.gradient_color2 = config.gradient.colors[1];
    }
    formOptions.gradient_angle = config.gradient.angle;
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

  // Map frame
  if (config.frame) {
    formOptions.frame_enabled = config.frame.enabled;
    formOptions.frame_style = (config.frame as any).style;
    formOptions.frame_text = (config.frame as any).text;
    formOptions.frame_text_position = (config.frame as any).text_position;
  }
  
  // Map error correction
  formOptions.ecl = config.error_correction;

  // Map transparent background
  formOptions.transparent_background = config.transparent_background;

  return formOptions;
} 