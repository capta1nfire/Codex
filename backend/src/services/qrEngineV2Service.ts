import axios from 'axios';

import { AppError, ErrorCode } from '../utils/errors.js';
import logger from '../utils/logger.js';

const QR_ENGINE_V2_URL = process.env.QR_ENGINE_V2_URL || 'http://localhost:3002';

export interface QrV2Options {
  size?: number;
  margin?: number;
  errorCorrection?: string;
  eyeShape?: string;
  dataPattern?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  eyeColor?: string;
  gradient?: {
    type: string;
    colors: string[];
    angle?: number;
    applyToEyes?: boolean;
    applyToData?: boolean;
    strokeStyle?: {
      enabled: boolean;
      color?: string;
      width?: number;
      opacity?: number;
    };
  };
  logo?: {
    data: string;
    size?: number;
    padding?: number;
    backgroundColor?: string;
    shape?: string;
  };
  frame?: {
    style: string;
    color?: string;
    width?: number;
    text?: string;
    textPosition?: string;
  };
  effects?: Array<{
    type: string;
    intensity?: number;
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blurRadius?: number;
  }>;
}

export interface QrV2GenerateRequest {
  data: string;
  options?: QrV2Options;
}

export interface QrV2GenerateResponse {
  svg: string;
  metadata: {
    version: number;
    modules: number;
    errorCorrection: string;
    dataCapacity: number;
    processingTimeMs: number;
    complexityLevel: string;
    qualityScore: number;
  };
  cached: boolean;
}

export interface QrV2ValidateRequest {
  data: string;
  options?: QrV2Options;
}

export interface QrV2ValidateResponse {
  valid: boolean;
  details: {
    dataLength: number;
    estimatedVersion: number;
    errorCorrectionCapacity: number;
    logoImpact?: number;
  };
  suggestions: string[];
}

class QrEngineV2Service {
  /**
   * Generate a QR code using the v2 engine
   */
  async generate(request: QrV2GenerateRequest): Promise<QrV2GenerateResponse> {
    try {
      logger.info('QR Engine v2 generation request', {
        dataLength: request.data.length,
        hasOptions: !!request.options,
      });

      // Transform camelCase to snake_case for Rust API
      const rustRequest = {
        data: request.data,
        options: request.options ? this.transformOptionsToRust(request.options) : undefined,
      };

      const response = await axios.post<QrV2GenerateResponse>(
        `${QR_ENGINE_V2_URL}/api/qr/generate`,
        rustRequest,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds
        }
      );

      logger.info('QR Engine v2 generation successful', {
        processingTime: response.data.metadata.processingTimeMs,
        complexityLevel: response.data.metadata.complexityLevel,
        cached: response.data.cached,
      });

      return response.data;
    } catch (error: any) {
      logger.error('QR Engine v2 generation failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 429) {
        throw new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 'QR generation rate limit exceeded');
      }

      throw new AppError(
        ErrorCode.QR_GENERATION_FAILED,
        'Failed to generate QR code with v2 engine'
      );
    }
  }

  /**
   * Validate QR code data and options
   */
  async validate(request: QrV2ValidateRequest): Promise<QrV2ValidateResponse> {
    try {
      const response = await axios.post<QrV2ValidateResponse>(
        `${QR_ENGINE_V2_URL}/api/qr/validate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('QR Engine v2 validation failed', {
        error: error.message,
      });

      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Failed to validate QR code data');
    }
  }

  /**
   * Generate preview URL for QR code
   */
  getPreviewUrl(params: {
    data: string;
    eyeShape?: string;
    dataPattern?: string;
    fgColor?: string;
    bgColor?: string;
    size?: number;
  }): string {
    const queryParams = new URLSearchParams({
      data: params.data,
      ...(params.eyeShape && { eye_shape: params.eyeShape }),
      ...(params.dataPattern && { data_pattern: params.dataPattern }),
      ...(params.fgColor && { fg_color: params.fgColor }),
      ...(params.bgColor && { bg_color: params.bgColor }),
      ...(params.size && { size: params.size.toString() }),
    });

    return `${QR_ENGINE_V2_URL}/api/qr/preview?${queryParams.toString()}`;
  }

  /**
   * Batch generate QR codes
   */
  async batch(codes: QrV2GenerateRequest[]): Promise<{
    success: boolean;
    results: Array<{
      id?: string;
      success: boolean;
      svg?: string;
      error?: string;
      metadata?: QrV2GenerateResponse['metadata'];
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalTimeMs: number;
      averageTimeMs: number;
    };
  }> {
    try {
      const response = await axios.post(
        `${QR_ENGINE_V2_URL}/api/qr/batch`,
        {
          codes,
          options: {
            maxConcurrent: 10,
            includeMetadata: true,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds for batch
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('QR Engine v2 batch generation failed', {
        error: error.message,
        codesCount: codes.length,
      });

      throw new AppError(ErrorCode.QR_GENERATION_FAILED, 'Failed to batch generate QR codes');
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const response = await axios.get(`${QR_ENGINE_V2_URL}/api/qr/cache/stats`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get QR Engine v2 cache stats', {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<boolean> {
    try {
      await axios.post(`${QR_ENGINE_V2_URL}/api/qr/cache/clear`);
      return true;
    } catch (error: any) {
      logger.error('Failed to clear QR Engine v2 cache', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Convert old API format to v2 format
   */
  convertFromOldFormat(oldRequest: any): QrV2GenerateRequest {
    const options: QrV2Options = {};

    if (oldRequest.options) {
      const oldOpts = oldRequest.options;

      // Size conversion (scale to pixels)
      if (oldOpts.scale) {
        options.size = oldOpts.scale * 100; // Approximate conversion
      }

      // Colors
      if (oldOpts.fgcolor) {
        options.foregroundColor = oldOpts.fgcolor;
      }
      if (oldOpts.bgcolor) {
        options.backgroundColor = oldOpts.bgcolor;
      }

      // Error correction
      if (oldOpts.ecl) {
        options.errorCorrection = oldOpts.ecl;
      }

      // Gradient
      if (oldOpts.gradient_enabled && oldOpts.gradient_colors) {
        options.gradient = {
          type: oldOpts.gradient_type || 'linear',
          colors: oldOpts.gradient_colors,
          angle: oldOpts.gradient_direction === 'horizontal' ? 0 : 90,
        };
      }
    }

    return {
      data: oldRequest.data,
      options,
    };
  }

  /**
   * Convert v2 response to old format for backward compatibility
   */
  convertToOldFormat(v2Response: QrV2GenerateResponse): any {
    return {
      success: true,
      svgString: v2Response.svg,
      svg: v2Response.svg,
      cached: v2Response.cached,
      metadata: {
        generation_time_ms: v2Response.metadata.processingTimeMs,
        from_cache: v2Response.cached,
        barcode_type: 'qrcode',
        data_size: v2Response.metadata.dataCapacity,
      },
    };
  }

  /**
   * Transform options from camelCase to snake_case for Rust API
   */
  private transformOptionsToRust(options: QrV2Options): any {
    const rustOptions: any = {};

    // Simple field mappings
    if (options.size !== undefined) rustOptions.size = options.size;
    if (options.margin !== undefined) rustOptions.margin = options.margin;
    if (options.errorCorrection !== undefined)
      rustOptions.error_correction = options.errorCorrection;
    if (options.eyeShape !== undefined) rustOptions.eye_shape = options.eyeShape;
    if (options.dataPattern !== undefined) rustOptions.data_pattern = options.dataPattern;
    if (options.foregroundColor !== undefined)
      rustOptions.foreground_color = options.foregroundColor;
    if (options.backgroundColor !== undefined)
      rustOptions.background_color = options.backgroundColor;
    if (options.eyeColor !== undefined) rustOptions.eye_color = options.eyeColor;

    // Transform gradient object
    if (options.gradient) {
      rustOptions.gradient = {
        type: options.gradient.type,
        colors: options.gradient.colors,
        angle: options.gradient.angle,
        apply_to_eyes: options.gradient.applyToEyes,
        apply_to_data: options.gradient.applyToData,
      };

      // Transform strokeStyle
      if (options.gradient.strokeStyle) {
        rustOptions.gradient.stroke_style = {
          enabled: options.gradient.strokeStyle.enabled,
          color: options.gradient.strokeStyle.color,
          width: options.gradient.strokeStyle.width,
          opacity: options.gradient.strokeStyle.opacity,
        };
      }
    }

    // Transform logo object
    if (options.logo) {
      rustOptions.logo = {
        data: options.logo.data,
        size: options.logo.size,
        padding: options.logo.padding,
        background_color: options.logo.backgroundColor,
        shape: options.logo.shape,
      };
    }

    // Transform frame object
    if (options.frame) {
      rustOptions.frame = {
        style: options.frame.style,
        color: options.frame.color,
        width: options.frame.width,
        text: options.frame.text,
        text_position: options.frame.textPosition,
      };
    }

    // Effects array can be passed as-is
    if (options.effects) {
      rustOptions.effects = options.effects;
    }

    return rustOptions;
  }
}

export default new QrEngineV2Service();
